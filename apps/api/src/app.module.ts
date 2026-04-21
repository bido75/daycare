import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AttendanceModule } from './attendance/attendance.module';
import { DailyReportsModule } from './daily-reports/daily-reports.module';
import { AuditModule } from './audit/audit.module';
import { BillingModule } from './billing/billing.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { DocumentsModule } from './documents/documents.module';
import { EmailModule } from './email/email.module';
import { IncidentsModule } from './incidents/incidents.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ParentsModule } from './parents/parents.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { ReportsModule } from './reports/reports.module';
import { SmsModule } from './sms/sms.module';
import { StaffModule } from './staff/staff.module';
import { StudentsModule } from './students/students.module';
import { StorageModule } from './storage/storage.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    AttendanceModule,
    DailyReportsModule,
    AuditModule,
    BillingModule,
    ClassroomsModule,
    DocumentsModule,
    EmailModule,
    IncidentsModule,
    MessagingModule,
    NotificationsModule,
    ParentsModule,
    RegistrationsModule,
    ReportsModule,
    SmsModule,
    StaffModule,
    StudentsModule,
    StorageModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    },
  ],
})
export class AppModule {}
