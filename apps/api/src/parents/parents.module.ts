import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ParentsService } from './parents.service';
import { ParentsController } from './parents.controller';

@Module({
  imports: [PrismaModule],
  providers: [ParentsService],
  controllers: [ParentsController],
  exports: [ParentsService],
})
export class ParentsModule {}
