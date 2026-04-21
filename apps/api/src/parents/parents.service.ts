import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ListParentsDto, UpdateParentProfileDto, UpdateParentPreferencesDto } from './parents.dto';

const DEFAULT_PREFERENCES = {
  emailNotifications: true,
  smsNotifications: false,
  dailyReportUpdates: true,
  paymentReminders: true,
  attendanceAlerts: true,
};

@Injectable()
export class ParentsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async findAll(filters: ListParentsDto) {
    const { search, page = 1, limit = 20 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      parentProfile: { isNot: null },
    };

    if (search) {
      where.OR = [
        { parentProfile: { firstName: { contains: search, mode: 'insensitive' } } },
        { parentProfile: { lastName: { contains: search, mode: 'insensitive' } } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          parentProfile: {
            include: {
              studentParents: {
                include: {
                  student: {
                    select: { id: true, firstName: true, lastName: true, isActive: true },
                  },
                },
              },
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        isActive: u.isActive,
        createdAt: u.createdAt,
        parentProfile: u.parentProfile,
        childrenCount: u.parentProfile?.studentParents.length ?? 0,
      })),
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        parentProfile: {
          include: {
            studentParents: {
              include: {
                student: {
                  include: {
                    classrooms: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.parentProfile) {
      throw new NotFoundException(`Parent ${id} not found`);
    }

    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      parentProfile: user.parentProfile,
      children: user.parentProfile.studentParents.map((sp) => ({
        ...sp.student,
        relationship: sp.relationship,
        isPrimary: sp.isPrimary,
      })),
    };
  }

  async getMyStudents(userId: string) {
    const parent = await this.prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        studentParents: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, isActive: true },
            },
          },
        },
      },
    });

    if (!parent) return [];

    return parent.studentParents.map((sp) => sp.student);
  }

  async getParentStats() {
    const [total, active] = await Promise.all([
      this.prisma.user.count({ where: { parentProfile: { isNot: null } } }),
      this.prisma.user.count({ where: { parentProfile: { isNot: null }, isActive: true } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { parentProfile: true },
    });
    if (!user || !user.parentProfile) throw new NotFoundException('Parent profile not found');
    return {
      id: user.id,
      email: user.email,
      parentProfile: user.parentProfile,
    };
  }

  async updateMe(userId: string, dto: UpdateParentProfileDto) {
    const profile = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Parent profile not found');
    const updated = await this.prisma.parentProfile.update({
      where: { userId },
      data: dto,
    });
    return updated;
  }

  async getPreferences(userId: string) {
    const profile = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Parent profile not found');
    const prefs = (profile.preferences as any) ?? DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...prefs };
  }

  async updatePreferences(userId: string, dto: UpdateParentPreferencesDto) {
    const profile = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Parent profile not found');
    const existing = (profile.preferences as any) ?? DEFAULT_PREFERENCES;
    const merged = { ...DEFAULT_PREFERENCES, ...existing, ...dto };
    await this.prisma.parentProfile.update({
      where: { userId },
      data: { preferences: merged },
    });
    return merged;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const profile = await this.prisma.parentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Parent profile not found');
    const ext = file.mimetype.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const key = `parents/${userId}/avatar.${ext}`;
    const { url } = await this.storageService.uploadFile(file.buffer, key, file.mimetype);
    await this.prisma.parentProfile.update({ where: { userId }, data: { photoUrl: url } });
    return { photoUrl: url };
  }
}
