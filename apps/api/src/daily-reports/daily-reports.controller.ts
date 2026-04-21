import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DailyReportsService } from './daily-reports.service';
import { CreateDailyReportDto, UpdateDailyReportDto, ListDailyReportsDto } from './daily-reports.dto';

@Controller('daily-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyReportsController {
  constructor(private readonly dailyReportsService: DailyReportsService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  async create(@Body() dto: CreateDailyReportDto, @CurrentUser() user: any) {
    const profile = await this.dailyReportsService['prisma'].staffProfile.findUnique({
      where: { userId: user.userId },
    });
    const staffId = profile?.id ?? user.userId;
    return this.dailyReportsService.create(dto, staffId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  update(@Param('id') id: string, @Body() dto: UpdateDailyReportDto) {
    return this.dailyReportsService.update(id, dto);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  findAll(@Query() query: ListDailyReportsDto, @CurrentUser() user: any) {
    return this.dailyReportsService.findAll(query, user.role, user.userId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.dailyReportsService.findOne(id, user.role, user.userId);
  }
}
