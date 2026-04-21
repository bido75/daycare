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
import { IntegrationService } from './integration.service';
import { CreateProviderDto, UpdateProviderDto, TestProviderDto } from './integration.dto';

@Controller('integrations/sms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post()
  createProvider(@Body() dto: CreateProviderDto) {
    return this.integrationService.createProvider(dto);
  }

  @Get()
  getProviders() {
    return this.integrationService.getProviders();
  }

  @Get(':id')
  getProvider(@Param('id') id: string) {
    return this.integrationService.getProvider(id);
  }

  @Patch(':id')
  updateProvider(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.integrationService.updateProvider(id, dto);
  }

  @Delete(':id')
  deleteProvider(@Param('id') id: string) {
    return this.integrationService.deleteProvider(id);
  }

  @Post(':id/default')
  setDefault(@Param('id') id: string) {
    return this.integrationService.setDefault(id);
  }

  @Post(':id/test')
  testProvider(@Param('id') id: string, @Body() dto: TestProviderDto) {
    return this.integrationService.testProvider(id, dto.testPhoneNumber);
  }
}
