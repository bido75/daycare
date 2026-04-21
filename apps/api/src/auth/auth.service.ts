import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { Response, Request } from 'express';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// In-memory reset token store (replace with DB in production)
const resetTokens = new Map<string, { email: string; expiresAt: Date }>();

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private success(data: any, message = 'OK') {
    return { success: true, data, message };
  }

  private generateAccessToken(payload: { sub: string; email: string; role: string }) {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-prod',
      expiresIn: '15m',
    });
  }

  private generateRefreshToken(payload: { sub: string }) {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-prod',
      expiresIn: '7d',
    });
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_EXPIRY,
      path: '/',
    });
  }

  async register(dto: RegisterDto, res: Response) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'PARENT',
        parentProfile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
          },
        },
      },
      include: { parentProfile: true },
    });

    const accessToken = this.generateAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = this.generateRefreshToken({ sub: user.id });
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshToken: refreshHash } });

    this.setRefreshCookie(res, refreshToken);

    // Send welcome email (fire-and-forget)
    this.emailService
      .sendTemplatedEmail(dto.email, 'welcomeEmail', { userName: dto.firstName }, 'auth')
      .catch(() => {});

    return this.success(
      {
        accessToken,
        user: { id: user.id, email: user.email, role: user.role, firstName: dto.firstName, lastName: dto.lastName },
      },
      'Registration successful',
    );
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { parentProfile: true, staffProfile: true },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.generateAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = this.generateRefreshToken({ sub: user.id });
    const refreshHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshHash, lastLoginAt: new Date() },
    });

    this.setRefreshCookie(res, refreshToken);

    const profile = user.parentProfile || user.staffProfile;
    return this.success(
      {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: (profile as any)?.firstName,
          lastName: (profile as any)?.lastName,
        },
      },
      'Login successful',
    );
  }

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.refreshToken;
    if (!token) throw new UnauthorizedException('No refresh token');

    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-prod',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.refreshToken) throw new UnauthorizedException('Refresh token revoked');

    const match = await bcrypt.compare(token, user.refreshToken);
    if (!match) throw new UnauthorizedException('Refresh token mismatch');

    const accessToken = this.generateAccessToken({ sub: user.id, email: user.email, role: user.role });
    const newRefresh = this.generateRefreshToken({ sub: user.id });
    const refreshHash = await bcrypt.hash(newRefresh, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshToken: refreshHash } });
    this.setRefreshCookie(res, newRefresh);

    return this.success({ accessToken }, 'Token refreshed');
  }

  async logout(userId: string, res: Response) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    res.clearCookie('refreshToken', { path: '/' });
    return this.success(null, 'Logged out');
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { parentProfile: true, staffProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, refreshToken, ...safe } = user;
    return this.success(safe);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Always return success to avoid email enumeration
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      resetTokens.set(token, { email: dto.email, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
      const resetUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;

      const profile = await this.prisma.parentProfile.findUnique({ where: { userId: user.id } })
        ?? await this.prisma.staffProfile.findUnique({ where: { userId: user.id } });
      const userName = (profile as any)?.firstName ?? dto.email;

      // Send password reset email (fire-and-forget)
      this.emailService
        .sendTemplatedEmail(dto.email, 'passwordReset', { resetUrl, userName }, 'auth')
        .catch(() => {});
    }
    return this.success(null, 'If that email exists, a reset link has been sent.');
  }

  async resetPassword(dto: ResetPasswordDto) {
    const entry = resetTokens.get(dto.token);
    if (!entry || entry.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.prisma.user.findUnique({ where: { email: entry.email } });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash, refreshToken: null } });
    resetTokens.delete(dto.token);

    return this.success(null, 'Password updated successfully');
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return this.success(null, 'Password changed successfully');
  }
}
