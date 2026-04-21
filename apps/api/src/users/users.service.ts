import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: { id: true, email: true, role: true, isActive: true, createdAt: true, parentProfile: true, staffProfile: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { success: true, data: { users, total, page, limit } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isActive: true, createdAt: true, parentProfile: true, staffProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: user };
  }

  async update(id: string, dto: { email?: string; role?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    const data: any = {};
    if (dto.email) data.email = dto.email;
    if (dto.role) data.role = dto.role;

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, isActive: true, createdAt: true, parentProfile: true, staffProfile: true },
    });
    return { success: true, data: user, message: 'User updated' };
  }

  async resetPassword(id: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { success: true, message: 'Password updated successfully' };
  }

  async deactivate(id: string) {
    const user = await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { success: true, data: { id: user.id, isActive: user.isActive }, message: 'User deactivated' };
  }

  async setActive(id: string, isActive: boolean) {
    const user = await this.prisma.user.update({ where: { id }, data: { isActive } });
    return { success: true, data: { id: user.id, isActive: user.isActive }, message: `User ${isActive ? 'activated' : 'deactivated'}` };
  }
}
