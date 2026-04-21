import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassroomDto, UpdateClassroomDto, AssignStudentDto, ListClassroomsDto, AssignStaffDto } from './classroom.dto';

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

  async findAll(filters: ListClassroomsDto = {}, user?: any) {
    const { search, page = 1, limit = 50 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Staff members only see the classroom(s) they are assigned to lead
    if (user?.role === 'STAFF') {
      const staffProfile = await this.prisma.staffProfile.findUnique({
        where: { userId: user.userId },
      });
      if (staffProfile) {
        where.leadStaffId = staffProfile.id;
      } else {
        return { data: [], meta: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
      }
    }

    const [total, classrooms] = await Promise.all([
      this.prisma.classroom.count({ where }),
      this.prisma.classroom.findMany({
        where,
        include: {
          leadStaff: {
            include: { user: { select: { email: true } } },
          },
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

    const enriched = classrooms.map((c) => ({
      ...c,
      studentCount: c.students.length,
      capacityUtilization: c.capacity > 0 ? Math.round((c.students.length / c.capacity) * 100) : 0,
      availableSpots: Math.max(0, c.capacity - c.students.length),
    }));

    return {
      data: enriched,
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
        leadStaff: {
          include: { user: { select: { email: true, role: true } } },
        },
        students: {
          include: {
            studentParents: {
              include: { parent: { select: { firstName: true, lastName: true } } },
            },
          },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
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

    return {
      ...classroom,
      studentCount: classroom.students.length,
      capacityUtilization: classroom.capacity > 0
        ? Math.round((classroom.students.length / classroom.capacity) * 100)
        : 0,
      availableSpots: Math.max(0, classroom.capacity - classroom.students.length),
    };
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

  async assignStaff(classroomId: string, dto: AssignStaffDto) {
    await this.findOne(classroomId);
    // Set as lead staff for this classroom
    return this.prisma.classroom.update({
      where: { id: classroomId },
      data: { leadStaffId: dto.staffId },
      include: { leadStaff: { include: { user: { select: { email: true } } } } },
    });
  }

  async removeStaff(classroomId: string) {
    await this.findOne(classroomId);
    return this.prisma.classroom.update({
      where: { id: classroomId },
      data: { leadStaffId: null },
      include: { leadStaff: true },
    });
  }

  async getClassroomStats() {
    const classrooms = await this.prisma.classroom.findMany({
      include: {
        _count: { select: { students: true } },
      },
    });

    return classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      capacity: c.capacity,
      enrolled: c._count.students,
      availableSpots: Math.max(0, c.capacity - c._count.students),
      occupancyRate: c.capacity > 0 ? Math.round((c._count.students / c.capacity) * 100) : 0,
      isActive: c.isActive,
    }));
  }
}
