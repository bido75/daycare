import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentIntentDto,
  RecordManualPaymentDto,
  ListPaymentsDto,
  RefundPaymentDto,
} from './billing.dto';

@Controller('billing/payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT', 'ADMIN', 'SUPER_ADMIN')
  createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.createPaymentIntent(dto.invoiceId, user.userId);
  }

  @Post('webhook')
  async webhook(
    @Req() req: any,
    @Headers('stripe-signature') sig: string,
  ) {
    if (!sig) throw new BadRequestException('Missing Stripe signature');

    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException('Missing raw body');

    let event: any;
    try {
      event = this.paymentsService.constructWebhookEvent(rawBody, sig);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook error: ${err.message}`);
    }

    return this.paymentsService.handleWebhook(event);
  }

  @Post('manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  recordManual(
    @Body() dto: RecordManualPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.recordManualPayment(dto, user.userId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  getStats() {
    return this.paymentsService.getPaymentStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  findAll(@Query() query: ListPaymentsDto) {
    return this.paymentsService.getPayments(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.paymentsService.getPayment(id);
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'FINANCE')
  refund(@Param('id') id: string, @Body() dto: RefundPaymentDto) {
    return this.paymentsService.refund(id, dto);
  }
}
