import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassroomDto, UpdateClassroomDto, AssignStudentDto, ListClassroomsDto } from './classroom.dto';

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClassroomDto) {
    return this.prisma.classroom.create({
      data: dto,
      include: {
        leadStaff: true,
        students: true,
      },
    });
  }

  async findAll(filters: ListClassroomsDto = {}) {
    const { search, page = 1, limit = 50 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [total, classrooms] = await Promise.all([
      this.prisma.classroom.count({ where }),
      this.prisma.classroom.findMany({
        where,
        include: {
          leadStaff: { include: { user: { select: { email: true } } } },
          students: {
            where: { isActive: true },
            select: { id: true, firstName: true, lastName: true },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      data: classrooms,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id },
      include: {
        leadStaff: { include: { user: { select: { email: true } } } },
        students: {
          include: {
            studentParents: {
              include: { parent: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        registrations: {
          where: { status: 'PENDING' },
          include: { student: true },
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom ${id} not found`);
    }

    return classroom;
  }

  async update(id: string, dto: UpdateClassroomDto) {
    await this.findOne(id);
    return this.prisma.classroom.update({
      where: { id },
      data: dto,
      include: { leadStaff: true, students: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.classroom.delete({ where: { id } });
  }

  async assignStudent(classroomId: string, dto: AssignStudentDto) {
    await this.findOne(classroomId);
    return this.prisma.classroom.update({
      where: { id: classroomId },
      data: { students: { connect: { id: dto.studentId } } },
      include: { students: true },
    });
  }

  async removeStudent(classroomId: string, studentId: string) {
    await this.findOne(classroomId);
    return this.prisma.classroom.update({
      where: { id: classroomId },
      data: { students: { disconnect: { id: studentId } } },
      include: { students: true },
    });
  }

  async listStudents(classroomId: string) {
    await this.findOne(classroomId);
    return this.prisma.student.findMany({
      where: { classrooms: { some: { id: classroomId } }, isActive: true },
      include: {
        emergencyContacts: true,
        studentParents: {
          include: { parent: { select: { firstName: true, lastName: true, phone: true } } },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }
}
