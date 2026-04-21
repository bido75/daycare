import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessagingService } from './messaging.service';
import { CreateThreadDto, SendMessageDto, ListThreadsDto, BroadcastDto } from './messaging.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('threads')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  createThread(@CurrentUser() user: any, @Body() dto: CreateThreadDto) {
    return this.messagingService.createThread(user.userId, dto);
  }

  @Get('threads')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  getThreads(@CurrentUser() user: any, @Query() query: ListThreadsDto) {
    return this.messagingService.getThreads(user.userId, query);
  }

  @Get('unread-count')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  getUnreadCount(@CurrentUser() user: any) {
    return this.messagingService.getUnreadCount(user.userId);
  }

  @Get('threads/:id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  getThread(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagingService.getThread(id, user.userId);
  }

  @Post('threads/:id/messages')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(id, user.userId, dto);
  }

  @Patch('threads/:id/read')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagingService.markAsRead(id, user.userId);
  }

  @Post('broadcast')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  broadcast(@CurrentUser() user: any, @Body() dto: BroadcastDto) {
    return this.messagingService.createBroadcast(user.userId, dto);
  }
}
