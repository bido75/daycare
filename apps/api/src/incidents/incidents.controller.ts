import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto, UpdateIncidentDto, ListIncidentsDto } from './incidents.dto';

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  create(@Body() dto: CreateIncidentDto, @CurrentUser() user: any) {
    return this.incidentsService.create(dto, user.userId);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  findAll(@Query() query: ListIncidentsDto, @CurrentUser() user: any) {
    return this.incidentsService.findAll(query, user.userId, user.role);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto, @CurrentUser() user: any) {
    return this.incidentsService.update(id, dto, user.userId, user.role);
  }
}
