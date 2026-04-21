import {
  Controller, Get, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ParentsService } from './parents.service';
import { ListParentsDto } from './parents.dto';

@Controller('parents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  findAll(@Query() query: ListParentsDto) {
    return this.parentsService.findAll(query);
  }

  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  getStats() {
    return this.parentsService.getParentStats();
  }

  @Get('me/students')
  @Roles('PARENT')
  getMyStudents(@CurrentUser() user: any) {
    return this.parentsService.getMyStudents(user.userId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'PARENT')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    // Parents can only view their own profile
    if (user.role === 'PARENT' && user.userId !== id) {
      return { message: 'Forbidden' };
    }
    return this.parentsService.findOne(id);
  }
}
