import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  CheckInDto,
  CheckOutDto,
  QrCheckInDto,
  QrCheckOutDto,
  ListAttendanceDto,
  MarkAbsentDto,
  BulkCheckInDto,
  AttendanceStatsDto,
} from './attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly storageService: StorageService,
  ) {}

  private async resolveAttendancePhotoUrl(record: any): Promise<any> {
    if (!record?.student) return record;
    return {
      ...record,
      student: {
        ...record.student,
        photoUrl: await this.storageService.resolvePhotoUrl(record.student.photoUrl),
      },
    };
  }

  // ─── QR Token ────────────────────────────────────────────────────────────────

  generateQrToken(parentProfileId: string): string {
    return this.jwtService.sign(
      { parentId: parentProfileId, type: 'QR_CHECKIN' },
      { expiresIn: '24h', secret: process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-prod' },
    );
  }

  validateQrToken(token: string): { parentId: string } {
    try {
      const payload = this.jwtService.verify<{ parentId: string; type: string }>(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-prod',
      });
      if (payload.type !== 'QR_CHECKIN') throw new UnauthorizedException('Invalid QR token type');
      return { parentId: payload.parentId };
    } catch {
      throw new UnauthorizedException('Invalid or expired QR token');
    }
  }

  // ─── Check In ─────────────────────────────────────────────────────────────

  async checkIn(dto: CheckInDto, staffId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findUnique({
      where: { studentId_date: { studentId: dto.studentId, date: today } },
    });

    if (existing) {
      if (existing.checkInTime) {
        throw new BadRequestException('Student is already checked in today');
      }
      const record = await this.prisma.attendance.update({
        where: { id: existing.id },
        data: { checkInTime: new Date(), status: 'PRESENT', staffId, notes: dto.notes },
        include: { student: true, classroom: true },
      });
      return this.resolveAttendancePhotoUrl(record);
    }

    const record = await this.prisma.attendance.create({
      data: {
        studentId: dto.studentId,
        classroomId: dto.classroomId,
        staffId,
        date: today,
        checkInTime: new Date(),
        status: 'PRESENT',
        notes: dto.notes,
      },
      include: { student: true, classroom: true },
    });
    return this.resolveAttendancePhotoUrl(record);
  }

  async checkOut(dto: CheckOutDto, staffId?: string) {
    const record = await this.prisma.attendance.findUnique({ where: { id: dto.attendanceId } });
    if (!record) throw new NotFoundException('Attendance record not found');
    if (record.checkOutTime) throw new BadRequestException('Student is already checked out');

    const updated = await this.prisma.attendance.update({
      where: { id: dto.attendanceId },
      data: { checkOutTime: new Date(), staffId: staffId ?? record.staffId, notes: dto.notes ?? record.notes },
      include: { student: true, classroom: true },
    });
    return this.resolveAttendancePhotoUrl(updated);
  }

  // ─── QR Check In/Out ─────────────────────────────────────────────────────

  async qrCheckIn(dto: QrCheckInDto) {
    const { parentId } = this.validateQrToken(dto.qrToken);

    const parent = await this.prisma.parentProfile.findUnique({
      where: { id: parentId },
      include: {
        studentParents: {
          include: { student: { include: { classrooms: { take: 1 } } } },
        },
      },
    });
    if (!parent) throw new NotFoundException('Parent not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results: any[] = [];
    for (const sp of parent.studentParents) {
      const student = sp.student;
      if (!student.isActive) continue;

      const existing = await this.prisma.attendance.findUnique({
        where: { studentId_date: { studentId: student.id, date: today } },
      });

      if (existing?.checkInTime) continue; // already checked in

      const record = existing
        ? await this.prisma.attendance.update({
            where: { id: existing.id },
            data: { checkInTime: new Date(), status: 'PRESENT', notes: 'QR_KIOSK' },
            include: { student: true, classroom: true },
          })
        : await this.prisma.attendance.create({
            data: {
              studentId: student.id,
              classroomId: student.classrooms?.[0]?.id ?? dto.classroomId ?? '',
              date: today,
              checkInTime: new Date(),
              status: 'PRESENT',
              notes: 'QR_KIOSK',
            },
            include: { student: true, classroom: true },
          });

      results.push(await this.resolveAttendancePhotoUrl(record));
    }

    const resolvedStudents = await Promise.all(
      parent.studentParents.map(async (sp) => ({
        ...sp.student,
        photoUrl: await this.storageService.resolvePhotoUrl(sp.student.photoUrl),
      })),
    );

    return { parentId, students: resolvedStudents, checkedIn: results };
  }

  async qrCheckOut(dto: QrCheckOutDto) {
    const { parentId } = this.validateQrToken(dto.qrToken);

    const parent = await this.prisma.parentProfile.findUnique({
      where: { id: parentId },
      include: { studentParents: { include: { student: true } } },
    });
    if (!parent) throw new NotFoundException('Parent not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results: any[] = [];
    for (const sp of parent.studentParents) {
      const record = await this.prisma.attendance.findUnique({
        where: { studentId_date: { studentId: sp.student.id, date: today } },
      });

      if (!record || !record.checkInTime || record.checkOutTime) continue;

      const updated = await this.prisma.attendance.update({
        where: { id: record.id },
        data: { checkOutTime: new Date() },
        include: { student: true, classroom: true },
      });
      results.push(await this.resolveAttendancePhotoUrl(updated));
    }

    const resolvedStudents = await Promise.all(
      parent.studentParents.map(async (sp) => ({
        ...sp.student,
        photoUrl: await this.storageService.resolvePhotoUrl(sp.student.photoUrl),
      })),
    );

    return { parentId, students: resolvedStudents, checkedOut: results };
  }

  // ─── QR token for a student's parent ────────────────────────────────────

  async getQrTokenForStudent(studentId: string) {
    const sp = await this.prisma.studentParent.findFirst({
      where: { studentId },
      include: { parent: true },
    });
    if (!sp) throw new NotFoundException('No parent found for this student');
    const token = this.generateQrToken(sp.parent.id);
    return { token, parentId: sp.parent.id };
  }

  async getQrTokenForParent(parentProfileId: string) {
    const parent = await this.prisma.parentProfile.findUnique({ where: { id: parentProfileId } });
    if (!parent) throw new NotFoundException('Parent profile not found');
    const token = this.generateQrToken(parentProfileId);
    return { token, parentId: parentProfileId };
  }

  // ─── Mark Absent ──────────────────────────────────────────────────────────

  async markAbsent(dto: MarkAbsentDto, staffId: string) {
    const date = this.parseLocalDate(dto.date);

    const existing = await this.prisma.attendance.findUnique({
      where: { studentId_date: { studentId: dto.studentId, date } },
    });

    if (existing) {
      const updated = await this.prisma.attendance.update({
        where: { id: existing.id },
        data: { status: 'ABSENT', staffId, notes: dto.notes, checkInTime: null, checkOutTime: null },
        include: { student: true, classroom: true },
      });
      return this.resolveAttendancePhotoUrl(updated);
    }

    const created = await this.prisma.attendance.create({
      data: {
        studentId: dto.studentId,
        classroomId: dto.classroomId,
        staffId,
        date,
        status: 'ABSENT',
        notes: dto.notes,
      },
      include: { student: true, classroom: true },
    });
    return this.resolveAttendancePhotoUrl(created);
  }

  // ─── Bulk Check In ────────────────────────────────────────────────────────

  async bulkCheckIn(dto: BulkCheckInDto, staffId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = await Promise.all(
      dto.studentIds.map((studentId) =>
        this.checkIn({ studentId, classroomId: dto.classroomId, method: 'MANUAL' }, staffId).catch(
          (e) => ({ error: e.message, studentId }),
        ),
      ),
    );

    return results;
  }

  // ─── Find All (role-filtered) ─────────────────────────────────────────────

  private parseLocalDate(dateStr: string): Date {
    // Parse "YYYY-MM-DD" as local midnight (not UTC)
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  async findAll(filters: ListAttendanceDto, userRole: string, userId: string) {
    const { date, dateFrom, dateTo, classroomId, studentId, status, page = 1, limit = 50 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (date) {
      where.date = this.parseLocalDate(date);
    } else if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = this.parseLocalDate(dateFrom);
      if (dateTo) where.date.lte = this.parseLocalDate(dateTo);
    }
    if (classroomId) where.classroomId = classroomId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    // PARENT: only see their children
    if (userRole === 'PARENT') {
      const parent = await this.prisma.parentProfile.findUnique({
        where: { userId },
        include: { studentParents: true },
      });
      if (!parent) return { data: [], total: 0 };
      const childIds = parent.studentParents.map((sp) => sp.studentId);
      where.studentId = { in: childIds };
    }

    const [total, rawData] = await Promise.all([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.findMany({
        where,
        include: { student: true, classroom: true, staff: true },
        skip,
        take: Number(limit),
        orderBy: [{ date: 'desc' }, { checkInTime: 'desc' }],
      }),
    ]);

    const data = await Promise.all(rawData.map((r) => this.resolveAttendancePhotoUrl(r)));

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async findByDate(date: string, classroomId?: string) {
    const d = this.parseLocalDate(date);

    const where: any = { date: d };
    if (classroomId) where.classroomId = classroomId;

    const records = await this.prisma.attendance.findMany({
      where,
      include: { student: true, classroom: true, staff: true },
      orderBy: { checkInTime: 'asc' },
    });
    return Promise.all(records.map((r) => this.resolveAttendancePhotoUrl(r)));
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getStats(filters: AttendanceStatsDto) {
    const { classroomId, dateFrom, dateTo } = filters;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {};
    if (classroomId) where.classroomId = classroomId;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const todayWhere: any = { date: today };
    if (classroomId) todayWhere.classroomId = classroomId;

    const [presentToday, absentToday, totalToday, allRecords] = await Promise.all([
      this.prisma.attendance.count({ where: { ...todayWhere, status: 'PRESENT' } }),
      this.prisma.attendance.count({ where: { ...todayWhere, status: 'ABSENT' } }),
      this.prisma.attendance.count({ where: todayWhere }),
      this.prisma.attendance.findMany({
        where: { ...where, checkInTime: { not: null }, checkOutTime: { not: null } },
        select: { checkInTime: true, checkOutTime: true },
      }),
    ]);

    const lateToday = await this.prisma.attendance.count({
      where: {
        ...todayWhere,
        status: 'PRESENT',
        checkInTime: { gt: new Date(today.getTime() + 9 * 60 * 60 * 1000) }, // after 9am
      },
    });

    const totalDuration = allRecords.reduce((sum, r) => {
      if (r.checkInTime && r.checkOutTime) {
        return sum + (r.checkOutTime.getTime() - r.checkInTime.getTime());
      }
      return sum;
    }, 0);

    const avgDurationMinutes =
      allRecords.length > 0 ? Math.round(totalDuration / allRecords.length / 60000) : 0;

    return {
      presentToday,
      absentToday,
      totalToday,
      lateToday,
      attendanceRate: totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0,
      avgDurationMinutes,
    };
  }
}
