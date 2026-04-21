import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('enrollment')
  @Roles('ADMIN', 'SUPER_ADMIN')
  getEnrollment(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.reportsService.getEnrollmentReport(dateFrom, dateTo);
  }

  @Get('attendance')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  getAttendance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('classroomId') classroomId?: string,
  ) {
    return this.reportsService.getAttendanceReport(dateFrom, dateTo, classroomId);
  }

  @Get('revenue')
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  getRevenue(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.reportsService.getRevenueReport(dateFrom, dateTo);
  }

  @Get('classrooms')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  getClassrooms() {
    return this.reportsService.getClassroomReport();
  }

  @Get('documents')
  @Roles('ADMIN', 'SUPER_ADMIN')
  getDocuments() {
    return this.reportsService.getDocumentReport();
  }

  @Get('export/:type')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'FINANCE')
  async exportCsv(
    @Param('type') type: string,
    @Query() filters: Record<string, string>,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.exportToCsv(type, filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    res.send(csv);
  }
}
