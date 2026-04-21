import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpdateStudentDto, AddEmergencyContactDto, AddAuthorizedPickupDto, ListStudentsDto } from './student.dto';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async findAll(filters: ListStudentsDto) {
    const { search, classroomId, status, sortBy = 'lastName', sortOrder = 'asc', page = 1, limit = 20 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (classroomId) {
      where.classrooms = { some: { id: classroomId } };
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Build orderBy based on sortBy
    let orderBy: any;
    if (sortBy === 'name') {
      orderBy = [{ lastName: sortOrder }, { firstName: sortOrder }];
    } else if (sortBy === 'enrollmentDate') {
      orderBy = [{ enrollmentDate: sortOrder }, { lastName: 'asc' }];
    } else if (sortBy === 'dateOfBirth') {
      orderBy = [{ dateOfBirth: sortOrder }];
    } else {
      orderBy = [{ lastName: sortOrder }, { firstName: 'asc' }];
    }

    const [total, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: {
          classrooms: true,
          studentParents: {
            include: {
              parent: {
                include: { user: { select: { email: true } } },
              },
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy,
      }),
    ]);

    return {
      data: students,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        classrooms: true,
        emergencyContacts: true,
        authorizedPickups: true,
        documents: true,
        studentParents: {
          include: {
            parent: {
              include: { user: { select: { email: true, role: true } } },
            },
          },
        },
        registrations: {
          include: { classroom: true },
          orderBy: { createdAt: 'desc' },
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student ${id} not found`);
    }

    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    const { classroomId, ...rest } = dto;
    const data: any = {
      ...rest,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
    };
    if (classroomId) {
      data.classrooms = { set: [{ id: classroomId }] };
    }
    return this.prisma.student.update({
      where: { id },
      data,
      include: { classrooms: true },
    });
  }

  async getStudentsByParent(parentId: string) {
    return this.prisma.student.findMany({
      where: {
        studentParents: { some: { parentId } },
      },
      include: {
        classrooms: true,
        emergencyContacts: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async getStudentStats() {
    const [total, active, inactive, byClassroom] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.student.count({ where: { isActive: true } }),
      this.prisma.student.count({ where: { isActive: false } }),
      this.prisma.classroom.findMany({
        include: {
          _count: { select: { students: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      byClassroom: byClassroom.map((c) => ({
        classroomId: c.id,
        classroomName: c.name,
        count: c._count.students,
      })),
    };
  }

  async addEmergencyContact(studentId: string, dto: AddEmergencyContactDto) {
    await this.findOne(studentId);
    return this.prisma.emergencyContact.create({
      data: { ...dto, studentId },
    });
  }

  async removeEmergencyContact(studentId: string, contactId: string) {
    return this.prisma.emergencyContact.delete({
      where: { id: contactId },
    });
  }

  async addAuthorizedPickup(studentId: string, dto: AddAuthorizedPickupDto) {
    await this.findOne(studentId);
    return this.prisma.authorizedPickup.create({
      data: { ...dto, studentId },
    });
  }

  async removeAuthorizedPickup(studentId: string, pickupId: string) {
    return this.prisma.authorizedPickup.delete({
      where: { id: pickupId },
    });
  }

  async uploadAvatar(studentId: string, userId: string, role: string, file: Express.Multer.File) {
    await this.findOne(studentId);
    if (role === 'PARENT') {
      const parent = await this.prisma.parentProfile.findUnique({
        where: { userId },
        include: { studentParents: { where: { studentId } } },
      });
      if (!parent || parent.studentParents.length === 0) {
        throw new ForbiddenException('Access denied to this student');
      }
    }
    const ext = file.mimetype.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const key = `students/${studentId}/avatar.${ext}`;
    const { url } = await this.storageService.uploadFile(file.buffer, key, file.mimetype);
    await this.prisma.student.update({ where: { id: studentId }, data: { photoUrl: url } });
    return { photoUrl: url };
  }
}
