import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';
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

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ─── Staff / Admin manual check-in ───────────────────────────────────────

  @Post('check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  async checkIn(@Body() dto: CheckInDto, @CurrentUser() user: any) {
    const staffProfile = await this.getStaffProfileId(user);
    return this.attendanceService.checkIn(dto, staffProfile);
  }

  @Post('check-out')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  async checkOut(@Body() dto: CheckOutDto, @CurrentUser() user: any) {
    const staffProfile = await this.getStaffProfileId(user);
    return this.attendanceService.checkOut(dto, staffProfile);
  }

  // ─── QR Kiosk endpoints (no auth – uses token in body) ───────────────────

  @Post('qr/check-in')
  qrCheckIn(@Body() dto: QrCheckInDto) {
    return this.attendanceService.qrCheckIn(dto);
  }

  @Post('qr/check-out')
  qrCheckOut(@Body() dto: QrCheckOutDto) {
    return this.attendanceService.qrCheckOut(dto);
  }

  // ─── Mark absent / bulk ───────────────────────────────────────────────────

  @Post('mark-absent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  async markAbsent(@Body() dto: MarkAbsentDto, @CurrentUser() user: any) {
    const staffProfile = await this.getStaffProfileId(user);
    return this.attendanceService.markAbsent(dto, staffProfile ?? user.userId);
  }

  @Post('bulk-check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  async bulkCheckIn(@Body() dto: BulkCheckInDto, @CurrentUser() user: any) {
    const staffProfile = await this.getStaffProfileId(user);
    return this.attendanceService.bulkCheckIn(dto, staffProfile);
  }

  // ─── List & stats ─────────────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  findAll(@Query() query: ListAttendanceDto, @CurrentUser() user: any) {
    return this.attendanceService.findAll(query, user.role, user.userId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  getStats(@Query() query: AttendanceStatsDto) {
    return this.attendanceService.getStats(query);
  }

  @Get('date/:date')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  findByDate(@Param('date') date: string, @Query('classroomId') classroomId?: string) {
    return this.attendanceService.findByDate(date, classroomId);
  }

  // ─── QR token generation ──────────────────────────────────────────────────

  @Get('qr-token/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  async getMyQrToken(@CurrentUser() user: any) {
    const parent = await this.attendanceService['prisma'].parentProfile.findUnique({
      where: { userId: user.userId },
    });
    if (!parent) throw new Error('Parent profile not found');
    return this.attendanceService.getQrTokenForParent(parent.id);
  }

  @Get('qr-token/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  getQrTokenForStudent(@Param('studentId') studentId: string) {
    return this.attendanceService.getQrTokenForStudent(studentId);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async getStaffProfileId(user: any): Promise<string | undefined> {
    if (user.role === 'STAFF') {
      const profile = await this.attendanceService['prisma'].staffProfile.findUnique({
        where: { userId: user.userId },
      });
      return profile?.id;
    }
    return undefined;
  }
}
