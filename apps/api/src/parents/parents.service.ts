import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListParentsDto } from './parents.dto';

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

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
}
