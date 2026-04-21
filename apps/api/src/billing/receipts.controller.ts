import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReceiptsService } from './receipts.service';
import { ListReceiptsDto } from './billing.dto';

@Controller('billing/receipts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE', 'PARENT')
  findAll(@Query() query: ListReceiptsDto, @CurrentUser() user: any) {
    return this.receiptsService.findAll(query, user.role, user.userId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.receiptsService.findOne(id);
  }

  @Get(':id/pdf')
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE', 'PARENT')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const receipt = await this.receiptsService.findOne(id);
    const pdfBuffer = await this.receiptsService.generateReceiptPdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`,
    );
    res.send(pdfBuffer);
  }
}
