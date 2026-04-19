import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';

@Module({
  imports: [PrismaModule],
  providers: [RegistrationsService],
  controllers: [RegistrationsController],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
