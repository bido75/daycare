import {
  Controller, Get, Patch, Post, Delete, Body, Param, Query, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudentsService } from './students.service';
import { UpdateStudentDto, AddEmergencyContactDto, AddAuthorizedPickupDto, ListStudentsDto } from './student.dto';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  findAll(@Query() query: ListStudentsDto) {
    return this.studentsService.findAll(query);
  }

  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  getStats() {
    return this.studentsService.getStudentStats();
  }

  @Get('by-parent/:parentId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  getByParent(@Param('parentId') parentId: string) {
    return this.studentsService.getStudentsByParent(parentId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Post(':id/emergency-contacts')
  @Roles('ADMIN', 'SUPER_ADMIN')
  addEmergencyContact(@Param('id') id: string, @Body() dto: AddEmergencyContactDto) {
    return this.studentsService.addEmergencyContact(id, dto);
  }

  @Delete(':id/emergency-contacts/:contactId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  removeEmergencyContact(@Param('id') id: string, @Param('contactId') contactId: string) {
    return this.studentsService.removeEmergencyContact(id, contactId);
  }

  @Post(':id/authorized-pickups')
  @Roles('ADMIN', 'SUPER_ADMIN')
  addAuthorizedPickup(@Param('id') id: string, @Body() dto: AddAuthorizedPickupDto) {
    return this.studentsService.addAuthorizedPickup(id, dto);
  }

  @Delete(':id/authorized-pickups/:pickupId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  removeAuthorizedPickup(@Param('id') id: string, @Param('pickupId') pickupId: string) {
    return this.studentsService.removeAuthorizedPickup(id, pickupId);
  }

  @Post(':id/avatar')
  @Roles('PARENT', 'ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        return cb(new BadRequestException('Only JPEG, PNG, and WebP images are allowed'), false);
      }
      cb(null, true);
    },
  }))
  uploadAvatar(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.studentsService.uploadAvatar(id, user.userId, user.role, file);
  }
}
