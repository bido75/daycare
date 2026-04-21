import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  ListInvoicesDto,
  BulkCreateInvoiceDto,
} from './billing.dto';

@Controller('billing/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: any) {
    return this.invoicesService.create(dto, user.userId);
  }

  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  getStats() {
    return this.invoicesService.getInvoiceStats();
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE', 'PARENT')
  findAll(@Query() query: ListInvoicesDto, @CurrentUser() user: any) {
    return this.invoicesService.findAll(query, user.role, user.userId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE', 'PARENT')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invoicesService.findOne(id, user.role, user.userId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, dto);
  }

  @Post(':id/void')
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  void(@Param('id') id: string) {
    return this.invoicesService.void(id);
  }

  @Post(':id/reminder')
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  sendReminder(@Param('id') id: string) {
    return this.invoicesService.sendReminder(id);
  }

  @Post('bulk')
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  bulkCreate(@Body() dto: BulkCreateInvoiceDto, @CurrentUser() user: any) {
    return this.invoicesService.bulkCreate(dto, user.userId);
  }
}
