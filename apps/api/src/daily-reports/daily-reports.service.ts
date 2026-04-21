import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDailyReportDto,
  UpdateDailyReportDto,
  ListDailyReportsDto,
} from './daily-reports.dto';

@Injectable()
export class DailyReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDailyReportDto, staffId: string) {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    return this.prisma.dailyReport.create({
      data: {
        studentId: dto.studentId,
        staffId,
        date,
        mood: dto.mood,
        meals: dto.meals ?? undefined,
        naps: dto.naps ?? undefined,
        activities: dto.activities ?? undefined,
        toileting: dto.toileting ?? undefined,
        notes: dto.notes,
        photoUrls: dto.photoUrls ?? [],
      },
      include: { student: true, staff: true },
    });
  }

  async update(id: string, dto: UpdateDailyReportDto) {
    const existing = await this.prisma.dailyReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Daily report not found');

    return this.prisma.dailyReport.update({
      where: { id },
      data: {
        mood: dto.mood,
        meals: dto.meals ?? undefined,
        naps: dto.naps ?? undefined,
        activities: dto.activities ?? undefined,
        toileting: dto.toileting ?? undefined,
        notes: dto.notes,
        photoUrls: dto.photoUrls,
      },
      include: { student: true, staff: true },
    });
  }

  async findAll(filters: ListDailyReportsDto, userRole: string, userId: string) {
    const { studentId, date, classroomId, page = 1, limit = 20 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (studentId) where.studentId = studentId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      where.date = d;
    }

    if (classroomId) {
      where.student = { classrooms: { some: { id: classroomId } } };
    }

    if (userRole === 'PARENT') {
      const parent = await this.prisma.parentProfile.findUnique({
        where: { userId },
        include: { studentParents: true },
      });
      if (!parent) return { data: [], total: 0 };
      const childIds = parent.studentParents.map((sp) => sp.studentId);
      where.studentId = studentId ? studentId : { in: childIds };
      // enforce parent only sees their own children
      if (studentId && !childIds.includes(studentId)) {
        throw new ForbiddenException('Access denied');
      }
    }

    const [total, data] = await Promise.all([
      this.prisma.dailyReport.count({ where }),
      this.prisma.dailyReport.findMany({
        where,
        include: { student: true, staff: true },
        skip,
        take: Number(limit),
        orderBy: { date: 'desc' },
      }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async findOne(id: string, userRole: string, userId: string) {
    const report = await this.prisma.dailyReport.findUnique({
      where: { id },
      include: { student: true, staff: true },
    });
    if (!report) throw new NotFoundException('Daily report not found');

    if (userRole === 'PARENT') {
      const parent = await this.prisma.parentProfile.findUnique({
        where: { userId },
        include: { studentParents: true },
      });
      const childIds = parent?.studentParents.map((sp) => sp.studentId) ?? [];
      if (!childIds.includes(report.studentId)) {
        throw new ForbiddenException('Access denied');
      }
    }

    return report;
  }

  async findByStudentAndDate(studentId: string, date: string) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return this.prisma.dailyReport.findUnique({
      where: { studentId_date: { studentId, date: d } },
      include: { student: true, staff: true },
    });
  }
}
