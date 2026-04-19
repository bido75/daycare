import {
  Controller, Get, Post, Body, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SmsService } from './sms.service';
import { SendSmsDto, BulkSmsDto, ListSmsLogsDto } from './sms.dto';

@Controller('sms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @Roles('ADMIN', 'SUPER_ADMIN')
  sendSms(@CurrentUser() user: any, @Body() dto: SendSmsDto) {
    return this.smsService.sendSms(dto.to, dto.message, user.id, dto.studentId);
  }

  @Post('bulk')
  @Roles('ADMIN', 'SUPER_ADMIN')
  sendBulk(@CurrentUser() user: any, @Body() dto: BulkSmsDto) {
    return this.smsService.sendBulkSms(dto.recipients, dto.message, user.id);
  }

  @Get('logs')
  @Roles('ADMIN', 'SUPER_ADMIN')
  getLogs(@Query() query: ListSmsLogsDto) {
    return this.smsService.getSmsLogs(query);
  }
}
