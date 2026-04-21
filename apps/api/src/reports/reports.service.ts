import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function toNum(d: any): number {
  if (!d) return 0;
  return parseFloat(d.toString());
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Enrollment Report ──────────────────────────────────────────────
  async getEnrollmentReport(dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date(new Date().getFullYear(), 0, 1);
    const to = dateTo ? new Date(dateTo) : new Date();

    const [totalStudents, activeStudents, inactiveStudents, recentRegistrations, byClassroom] =
      await Promise.all([
        this.prisma.student.count(),
        this.prisma.student.count({ where: { isActive: true } }),
        this.prisma.student.count({ where: { isActive: false } }),
        this.prisma.registration.findMany({
          where: { createdAt: { gte: from, lte: to } },
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
            classroom: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        this.prisma.classroom.findMany({
          include: {
            _count: { select: { students: true } },
            students: { select: { isActive: true } },
          },
        }),
      ]);

    // New enrollments per month
    const allRegistrations = await this.prisma.registration.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    });

    const byMonth: Record<string, number> = {};
    for (const reg of allRegistrations) {
      const key = `${reg.createdAt.getFullYear()}-${String(reg.createdAt.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    }
    const enrollmentTrend = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    const pendingRegistrations = await this.prisma.registration.count({
      where: { status: 'PENDING', createdAt: { gte: from, lte: to } },
    });

    return {
      summary: { totalStudents, activeStudents, inactiveStudents, pendingRegistrations },
      enrollmentTrend,
      byClassroom: byClassroom.map((c) => ({
        id: c.id,
        name: c.name,
        capacity: c.capacity,
        enrolled: c._count.students,
        active: c.students.filter((s) => s.isActive).length,
      })),
      recentRegistrations,
    };
  }

  // ── Attendance Report ──────────────────────────────────────────────
  async getAttendanceReport(dateFrom?: string, dateTo?: string, classroomId?: string) {
    const from = dateFrom
      ? new Date(dateFrom)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = dateTo ? new Date(dateTo) : new Date();

    const where: any = { date: { gte: from, lte: to } };
    if (classroomId) where.classroomId = classroomId;

    const records = await this.prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        classroom: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Daily attendance rate
    const byDay: Record<string, { present: number; total: number }> = {};
    for (const rec of records) {
      const key = rec.date.toISOString().split('T')[0];
      if (!byDay[key]) byDay[key] = { present: 0, total: 0 };
      byDay[key].total++;
      if (rec.status === 'PRESENT') byDay[key].present++;
    }
    const dailyRate = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
        present: v.present,
        total: v.total,
      }));

    const totalRecords = records.length;
    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const avgRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    // Absences by student
    const absenceMap: Record<string, { student: any; count: number }> = {};
    for (const rec of records) {
      if (rec.status === 'ABSENT') {
        const key = rec.studentId;
        if (!absenceMap[key]) absenceMap[key] = { student: rec.student, count: 0 };
        absenceMap[key].count++;
      }
    }
    const mostAbsent = Object.values(absenceMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // By classroom
    const classroomMap: Record<string, { name: string; present: number; total: number }> = {};
    for (const rec of records) {
      const key = rec.classroomId;
      if (!classroomMap[key]) classroomMap[key] = { name: rec.classroom.name, present: 0, total: 0 };
      classroomMap[key].total++;
      if (rec.status === 'PRESENT') classroomMap[key].present++;
    }
    const byClassroomSummary = Object.entries(classroomMap).map(([id, v]) => ({
      classroomId: id,
      name: v.name,
      present: v.present,
      total: v.total,
      rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
    }));

    return { summary: { avgRate, totalRecords, presentCount }, dailyRate, mostAbsent, byClassroom: byClassroomSummary };
  }

  // ── Revenue Report ─────────────────────────────────────────────────
  async getRevenueReport(dateFrom?: string, dateTo?: string) {
    const from = dateFrom
      ? new Date(dateFrom)
      : new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1);
    const to = dateTo ? new Date(dateTo) : new Date();

    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
          status: true,
          issueDate: true,
          dueDate: true,
        },
      }),
      this.prisma.payment.findMany({
        where: { createdAt: { gte: from, lte: to }, status: 'COMPLETED' },
        select: { amount: true, method: true, paidAt: true, createdAt: true },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + toNum(p.amount), 0);
    const totalInvoiced = invoices.reduce((sum, i) => sum + toNum(i.totalAmount), 0);
    const outstanding = invoices
      .filter((i) => i.status !== 'PAID')
      .reduce((sum, i) => sum + (toNum(i.totalAmount) - toNum(i.paidAmount)), 0);
    const collectionRate = totalInvoiced > 0 ? Math.round((totalRevenue / totalInvoiced) * 100) : 0;
    const avgInvoice = invoices.length > 0 ? Math.round(totalInvoiced / invoices.length) : 0;

    // Monthly revenue
    const monthlyMap: Record<string, number> = {};
    for (const p of payments) {
      const d = p.paidAt || p.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + toNum(p.amount);
    }
    const monthlyRevenue = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }));

    // Payment method breakdown
    const methodMap: Record<string, number> = {};
    for (const p of payments) {
      methodMap[p.method] = (methodMap[p.method] || 0) + toNum(p.amount);
    }
    const paymentMethods = Object.entries(methodMap).map(([method, amount]) => ({ method, amount }));

    return {
      summary: { totalRevenue, outstanding, collectionRate, avgInvoice },
      monthlyRevenue,
      paymentMethods,
    };
  }

  // ── Classroom Report ───────────────────────────────────────────────
  async getClassroomReport() {
    const classrooms = await this.prisma.classroom.findMany({
      include: {
        students: { select: { id: true, isActive: true } },
        leadStaff: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
    });

    return classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      capacity: c.capacity,
      enrolled: c._count.students,
      active: c.students.filter((s) => s.isActive).length,
      utilization: c.capacity > 0 ? Math.round((c._count.students / c.capacity) * 100) : 0,
      leadStaff: c.leadStaff
        ? `${c.leadStaff.firstName} ${c.leadStaff.lastName}`
        : null,
      ageGroup: `${c.ageGroupMin}-${c.ageGroupMax}`,
      isActive: c.isActive,
    }));
  }

  // ── Document Compliance Report ─────────────────────────────────────
  async getDocumentReport() {
    const [allDocs, students] = await Promise.all([
      this.prisma.document.findMany({
        include: { student: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.student.findMany({
        where: { isActive: true },
        select: { id: true, firstName: true, lastName: true },
      }),
    ]);

    const totalDocs = allDocs.length;
    const verifiedDocs = allDocs.filter((d) => d.verified).length;
    const verificationRate = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 0;

    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = allDocs.filter((d) => d.expiresAt && d.expiresAt >= now && d.expiresAt <= soon);
    const expired = allDocs.filter((d) => d.expiresAt && d.expiresAt < now);

    // Students with unverified docs
    const unverifiedByStudent: Record<string, any> = {};
    for (const doc of allDocs.filter((d) => !d.verified)) {
      const key = doc.studentId;
      if (!unverifiedByStudent[key]) {
        unverifiedByStudent[key] = { student: doc.student, count: 0 };
      }
      unverifiedByStudent[key].count++;
    }
    const studentsWithUnverified = Object.values(unverifiedByStudent);

    return {
      summary: { totalDocs, verifiedDocs, unverifiedDocs: totalDocs - verifiedDocs, verificationRate },
      expiringSoon,
      expired,
      studentsWithUnverified,
      totalStudents: students.length,
    };
  }

  // ── CSV Export ─────────────────────────────────────────────────────
  async exportToCsv(reportType: string, filters: Record<string, string>): Promise<string> {
    switch (reportType) {
      case 'enrollment': {
        const data = await this.getEnrollmentReport(filters.dateFrom, filters.dateTo);
        const rows = [
          ['Month', 'New Enrollments'],
          ...data.enrollmentTrend.map((r) => [r.month, r.count]),
        ];
        return rows.map((r) => r.join(',')).join('\n');
      }
      case 'attendance': {
        const data = await this.getAttendanceReport(filters.dateFrom, filters.dateTo, filters.classroomId);
        const rows = [
          ['Date', 'Present', 'Total', 'Rate %'],
          ...data.dailyRate.map((r) => [r.date, r.present, r.total, r.rate]),
        ];
        return rows.map((r) => r.join(',')).join('\n');
      }
      case 'revenue': {
        const data = await this.getRevenueReport(filters.dateFrom, filters.dateTo);
        const rows = [
          ['Month', 'Revenue'],
          ...data.monthlyRevenue.map((r) => [r.month, r.revenue]),
        ];
        return rows.map((r) => r.join(',')).join('\n');
      }
      case 'classrooms': {
        const data = await this.getClassroomReport();
        const rows = [
          ['Name', 'Capacity', 'Enrolled', 'Active', 'Utilization %', 'Lead Staff'],
          ...data.map((c) => [c.name, c.capacity, c.enrolled, c.active, c.utilization, c.leadStaff || '']),
        ];
        return rows.map((r) => r.join(',')).join('\n');
      }
      case 'documents': {
        const data = await this.getDocumentReport();
        const rows = [
          ['Total', 'Verified', 'Unverified', 'Verification Rate %'],
          [data.summary.totalDocs, data.summary.verifiedDocs, data.summary.unverifiedDocs, data.summary.verificationRate],
        ];
        return rows.map((r) => r.join(',')).join('\n');
      }
      default:
        return 'No data';
    }
  }
}
