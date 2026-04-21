import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DailyReportsService } from './daily-reports.service';
import { DailyReportsController } from './daily-reports.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DailyReportsController],
  providers: [DailyReportsService],
  exports: [DailyReportsService],
})
export class DailyReportsModule {}
