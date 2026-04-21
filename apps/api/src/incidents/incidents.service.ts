import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto, UpdateIncidentDto, ListIncidentsDto } from './incidents.dto';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIncidentDto, userId: string) {
    const staffProfile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });
    if (!staffProfile) {
      throw new ForbiddenException('Staff profile not found');
    }

    return this.prisma.incidentLog.create({
      data: {
        studentId: dto.studentId,
        staffId: staffProfile.id,
        type: dto.type,
        severity: dto.severity,
        description: dto.description,
        actionTaken: dto.actionTaken,
        parentNotified: dto.parentNotified ?? false,
        occurredAt: new Date(dto.occurredAt),
        status: 'OPEN',
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        staff: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAll(filters: ListIncidentsDto, userId: string, userRole: string) {
    const { studentId, severity, status, dateFrom, dateTo, page = 1, limit = 20 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    // For STAFF, restrict to students in their classroom
    if (userRole === 'STAFF') {
      const staffProfile = await this.prisma.staffProfile.findUnique({
        where: { userId },
        include: {
          classrooms: { select: { id: true, students: { select: { id: true } } } },
        },
      });
      if (staffProfile) {
        const classroomStudentIds = staffProfile.classrooms.flatMap((c) =>
          c.students.map((s) => s.id),
        );
        where.studentId = { in: classroomStudentIds };
      }
    }

    if (studentId) where.studentId = studentId;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.occurredAt = {};
      if (dateFrom) where.occurredAt.gte = new Date(dateFrom);
      if (dateTo) where.occurredAt.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.incidentLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { occurredAt: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          staff: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.incidentLog.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async findOne(id: string) {
    const incident = await this.prisma.incidentLog.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true } },
        staff: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async update(id: string, dto: UpdateIncidentDto, userId: string, userRole: string) {
    const incident = await this.findOne(id);

    // Staff can only update incidents they reported or for their classroom
    if (userRole === 'STAFF') {
      const staffProfile = await this.prisma.staffProfile.findUnique({ where: { userId } });
      if (!staffProfile || incident.staffId !== staffProfile.id) {
        throw new ForbiddenException('You can only update incidents you reported');
      }
    }

    const data: any = {};
    if (dto.actionTaken !== undefined) data.actionTaken = dto.actionTaken;
    if (dto.parentNotified !== undefined) {
      data.parentNotified = dto.parentNotified;
      if (dto.parentNotified) data.parentNotifiedAt = new Date();
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'RESOLVED' && !incident.resolvedAt) {
        data.resolvedAt = new Date();
      }
    }
    if (dto.resolvedAt !== undefined) data.resolvedAt = new Date(dto.resolvedAt);

    return this.prisma.incidentLog.update({
      where: { id },
      data,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        staff: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}
