import {
  Controller, Get, Patch, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { ListNotificationsDto } from './notifications.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  findAll(@CurrentUser() user: any, @Query() query: ListNotificationsDto) {
    return this.notificationsService.findAll(user.userId, query);
  }

  @Get('unread-count')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  @Patch('read-all')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Patch(':id/read')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(id, user.userId);
  }
}
