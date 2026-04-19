import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto, UpdateRegistrationStatusDto, ListRegistrationsDto } from './registration.dto';

@Controller('registrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  @Roles('PARENT')
  create(@CurrentUser() user: any, @Body() dto: CreateRegistrationDto) {
    return this.registrationsService.create(user.userId, dto);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'PARENT')
  findAll(@CurrentUser() user: any, @Query() query: ListRegistrationsDto) {
    return this.registrationsService.findAll({
      ...query,
      userId: user.userId,
      userRole: user.role,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'PARENT', 'STAFF')
  findOne(@Param('id') id: string) {
    return this.registrationsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRegistrationStatusDto) {
    return this.registrationsService.updateStatus(id, dto);
  }
}
