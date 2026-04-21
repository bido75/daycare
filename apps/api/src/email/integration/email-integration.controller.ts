import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { EmailIntegrationService } from './email-integration.service';
import {
  CreateEmailProviderDto,
  UpdateEmailProviderDto,
  TestEmailProviderDto,
} from './email-integration.dto';

@Controller('integrations/email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class EmailIntegrationController {
  constructor(private readonly emailIntegrationService: EmailIntegrationService) {}

  @Post()
  createProvider(@Body() dto: CreateEmailProviderDto) {
    return this.emailIntegrationService.createProvider(dto);
  }

  @Get()
  getProviders() {
    return this.emailIntegrationService.getProviders();
  }

  @Get(':id')
  getProvider(@Param('id') id: string) {
    return this.emailIntegrationService.getProvider(id);
  }

  @Patch(':id')
  updateProvider(@Param('id') id: string, @Body() dto: UpdateEmailProviderDto) {
    return this.emailIntegrationService.updateProvider(id, dto);
  }

  @Delete(':id')
  deleteProvider(@Param('id') id: string) {
    return this.emailIntegrationService.deleteProvider(id);
  }

  @Post(':id/default')
  setDefault(@Param('id') id: string) {
    return this.emailIntegrationService.setDefault(id);
  }

  @Post(':id/test')
  testProvider(@Param('id') id: string, @Body() dto: TestEmailProviderDto) {
    return this.emailIntegrationService.testProvider(id, dto.testEmail);
  }
}
