import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClassroomsService } from './classrooms.service';
import { ClassroomsController } from './classrooms.controller';

@Module({
  imports: [PrismaModule],
  providers: [ClassroomsService],
  controllers: [ClassroomsController],
  exports: [ClassroomsService],
})
export class ClassroomsModule {}
