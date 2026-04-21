import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto, UpdateClassroomDto, AssignStudentDto, AssignStaffDto, ListClassroomsDto } from './classroom.dto';

@Controller('classrooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Body() dto: CreateClassroomDto) {
    return this.classroomsService.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  findAll(@Query() query: ListClassroomsDto, @CurrentUser() user: any) {
    return this.classroomsService.findAll(query, user);
  }

  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  getStats() {
    return this.classroomsService.getClassroomStats();
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.classroomsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateClassroomDto) {
    return this.classroomsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.classroomsService.remove(id);
  }

  @Post(':id/students')
  @Roles('ADMIN', 'SUPER_ADMIN')
  assignStudent(@Param('id') id: string, @Body() dto: AssignStudentDto) {
    return this.classroomsService.assignStudent(id, dto);
  }

  @Delete(':id/students/:studentId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.classroomsService.removeStudent(id, studentId);
  }

  @Get(':id/students')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  listStudents(@Param('id') id: string) {
    return this.classroomsService.listStudents(id);
  }

  @Post(':id/staff')
  @Roles('ADMIN', 'SUPER_ADMIN')
  assignStaff(@Param('id') id: string, @Body() dto: AssignStaffDto) {
    return this.classroomsService.assignStaff(id, dto);
  }

  @Delete(':id/staff')
  @Roles('ADMIN', 'SUPER_ADMIN')
  removeStaff(@Param('id') id: string) {
    return this.classroomsService.removeStaff(id);
  }
}
