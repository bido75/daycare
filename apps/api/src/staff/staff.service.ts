import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, UpdateStaffDto, ListStaffDto } from './staff.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStaffDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash('TempPassword123!', 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: (dto.role as any) ?? 'STAFF',
        staffProfile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            position: dto.position,
            hireDate: new Date(),
          },
        },
      },
      include: {
        staffProfile: true,
      },
    });

    // Assign classroom if provided
    if (dto.classroomId && user.staffProfile) {
      await this.prisma.classroom.update({
        where: { id: dto.classroomId },
        data: { leadStaffId: user.staffProfile.id },
      });
    }

    return user;
  }

  async findAll(filters: ListStaffDto) {
    const { search, role, classroomId, status, page = 1, limit = 20 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      staffProfile: { isNot: null },
    };

    if (search) {
      where.OR = [
        { staffProfile: { firstName: { contains: search, mode: 'insensitive' } } },
        { staffProfile: { lastName: { contains: search, mode: 'insensitive' } } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role.toUpperCase();
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const staffProfileWhere: any = {};
    if (classroomId) {
      staffProfileWhere.classrooms = { some: { id: classroomId } };
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          staffProfile: {
            include: {
              classrooms: { select: { id: true, name: true } },
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const filtered = classroomId
      ? users.filter((u) => u.staffProfile?.classrooms.some((c) => c.id === classroomId))
      : users;

    return {
      data: filtered.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        staffProfile: u.staffProfile,
      })),
      meta: {
        total: classroomId ? filtered.length : total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((classroomId ? filtered.length : total) / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        staffProfile: {
          include: {
            classrooms: { select: { id: true, name: true, ageGroupMin: true, ageGroupMax: true } },
          },
        },
      },
    });

    if (!user || !user.staffProfile) {
      throw new NotFoundException(`Staff member ${id} not found`);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      staffProfile: user.staffProfile,
    };
  }

  async update(id: string, dto: UpdateStaffDto) {
    await this.findOne(id);

    const { classroomId, role, ...profileData } = dto;

    await this.prisma.$transaction(async (tx) => {
      if (role) {
        await tx.user.update({
          where: { id },
          data: { role: role as any },
        });
      }

      await tx.staffProfile.update({
        where: { userId: id },
        data: profileData,
      });

      if (classroomId) {
        const profile = await tx.staffProfile.findUnique({ where: { userId: id } });
        if (profile) {
          await tx.classroom.update({
            where: { id: classroomId },
            data: { leadStaffId: profile.id },
          });
        }
      }
    });

    return this.findOne(id);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });
  }

  async getStaffStats() {
    const [total, active, inactive, byRole] = await Promise.all([
      this.prisma.user.count({ where: { staffProfile: { isNot: null } } }),
      this.prisma.user.count({ where: { staffProfile: { isNot: null }, isActive: true } }),
      this.prisma.user.count({ where: { staffProfile: { isNot: null }, isActive: false } }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: { staffProfile: { isNot: null } },
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      inactive,
      byRole: byRole.map((r) => ({ role: r.role, count: r._count })),
    };
  }
}
