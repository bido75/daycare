import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  getAll() {
    return this.settingsService.getAll();
  }

  @Get(':key')
  @Roles('ADMIN', 'SUPER_ADMIN')
  getOne(@Param('key') key: string) {
    return this.settingsService.get(key);
  }

  @Put(':key')
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(@Param('key') key: string, @Body() body: { value: any }) {
    return this.settingsService.set(key, body.value);
  }
}
