import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStudentDto, AddEmergencyContactDto, AddAuthorizedPickupDto, ListStudentsDto } from './student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: ListStudentsDto) {
    const { search, classroomId, status, page = 1, limit = 20 } = filters;
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
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
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
    return this.prisma.student.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
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
}
