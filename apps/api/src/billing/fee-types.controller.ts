import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeeTypesService } from './fee-types.service';
import { CreateFeeTypeDto, UpdateFeeTypeDto, ListFeeTypesDto } from './billing.dto';

@Controller('billing/fee-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeTypesController {
  constructor(private readonly feeTypesService: FeeTypesService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  create(@Body() dto: CreateFeeTypeDto) {
    return this.feeTypesService.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'FINANCE')
  findAll(@Query() query: ListFeeTypesDto) {
    return this.feeTypesService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'FINANCE')
  findOne(@Param('id') id: string) {
    return this.feeTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  update(@Param('id') id: string, @Body() dto: UpdateFeeTypeDto) {
    return this.feeTypesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  deactivate(@Param('id') id: string) {
    return this.feeTypesService.deactivate(id);
  }
}
