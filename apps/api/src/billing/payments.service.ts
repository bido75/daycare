import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ReceiptsService } from './receipts.service';
import {
  RecordManualPaymentDto,
  ListPaymentsDto,
  RefundPaymentDto,
} from './billing.dto';

// Use require for Stripe to avoid namespace issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Stripe = require('stripe');

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: any;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private receiptsService: ReceiptsService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-03-25.dahlia',
    });
  }

  async createPaymentIntent(invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { parent: { include: { user: true } } },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID') throw new BadRequestException('Invoice already paid');
    if (invoice.status === 'VOID') throw new BadRequestException('Invoice is voided');

    const balanceDue = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    if (balanceDue <= 0) throw new BadRequestException('No balance due on this invoice');

    const amountInCents = Math.round(balanceDue * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        parentId: invoice.parentId,
        userId,
      },
      description: `Invoice ${invoice.invoiceNumber} - Creative Kids Academy`,
    });

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: balanceDue,
        method: 'STRIPE',
        status: 'PENDING',
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
      amount: balanceDue,
      invoiceNumber: invoice.invoiceNumber,
    };
  }

  async handleWebhook(event: any) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await this.handleRefund(event.data.object);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(paymentIntent: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: {
        invoice: { include: { parent: { include: { user: true } } } },
      },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    const paidAmount = paymentIntent.amount / 100;
    const invoice = payment.invoice as any;
    const newPaidAmount = Number(invoice.paidAmount) + paidAmount;
    const newStatus =
      newPaidAmount >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          stripeChargeId: paymentIntent.latest_charge as string,
          paidAt: new Date(),
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { paidAmount: newPaidAmount, status: newStatus },
      });
    });

    await this.receiptsService.create(payment.id, { invoiceId: invoice.id });

    const parentEmail = invoice.parent.user.email;
    const parentName = `${invoice.parent.firstName} ${invoice.parent.lastName}`;
    await this.emailService.sendEmail(
      parentEmail,
      `Payment Confirmed - Invoice ${invoice.invoiceNumber}`,
      `
        <h2>Payment Confirmed</h2>
        <p>Dear ${parentName},</p>
        <p>We received your payment of <strong>$${paidAmount.toFixed(2)}</strong> for invoice <strong>${invoice.invoiceNumber}</strong>.</p>
        <p>Thank you!</p><p>Creative Kids Academy</p>
      `,
      { context: 'billing' },
    );

    this.logger.log(`Payment succeeded for invoice ${invoice.invoiceNumber}: $${paidAmount}`);
  }

  private async handlePaymentFailed(paymentIntent: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    this.logger.warn(`Payment failed for intent: ${paymentIntent.id}`);
  }

  private async handleRefund(charge: any) {
    if (!charge.payment_intent) return;

    const payment = await this.prisma.payment.findFirst({
      where: { stripeChargeId: charge.id },
    });

    if (!payment) return;

    const refundedAmount = charge.amount_refunded / 100;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: charge.refunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        notes: `Refunded: $${refundedAmount.toFixed(2)}`,
      },
    });

    this.logger.log(`Refund processed for charge ${charge.id}: $${refundedAmount}`);
  }

  async recordManualPayment(dto: RecordManualPaymentDto, adminId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'VOID') throw new BadRequestException('Invoice is voided');

    const newPaidAmount = Number(invoice.paidAmount) + dto.amount;
    const newStatus =
      newPaidAmount >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

    const payment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          method: dto.method,
          status: 'COMPLETED',
          transactionRef: dto.reference,
          notes: dto.notes,
          paidAt: new Date(),
        },
      });

      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: { paidAmount: newPaidAmount, status: newStatus },
      });

      return p;
    });

    await this.receiptsService.create(payment.id, { invoiceId: dto.invoiceId });

    return payment;
  }

  async getPayments(filters: ListPaymentsDto) {
    const { invoiceId, parentId, status, method, dateFrom, dateTo, page = 1, limit = 20 } =
      filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (invoiceId) where.invoiceId = invoiceId;
    if (status) where.status = status.toUpperCase();
    if (method) where.method = method.toUpperCase();
    if (parentId) where.invoice = { parentId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        include: {
          invoice: { include: { parent: { include: { user: true } } } },
          receipt: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: payments.map((p) => ({ ...p, amount: Number(p.amount) })),
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            items: { include: { feeType: true } },
            parent: { include: { user: true } },
          },
        },
        receipt: true,
      },
    });

    if (!payment) throw new NotFoundException(`Payment ${id} not found`);

    return { ...payment, amount: Number(payment.amount) };
  }

  async refund(paymentId: string, dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    const refundAmount = dto.amount ?? Number(payment.amount);

    if (payment.stripeChargeId) {
      await this.stripe.refunds.create({
        charge: payment.stripeChargeId,
        amount: Math.round(refundAmount * 100),
        reason: dto.reason ?? 'requested_by_customer',
      });
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        notes: `Refunded: $${refundAmount.toFixed(2)}. Reason: ${dto.reason ?? 'N/A'}`,
      },
    });

    const newPaidAmount = Math.max(
      0,
      Number((payment.invoice as any).paidAmount) - refundAmount,
    );
    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newPaidAmount === 0 ? 'PENDING' : 'PARTIALLY_PAID',
      },
    });

    return { message: 'Refund processed successfully', refundAmount };
  }

  async getPaymentStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCollected, byMethod, thisMonth] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalCollected: Number(totalCollected._sum.amount ?? 0),
      totalTransactions: totalCollected._count,
      thisMonth: {
        amount: Number(thisMonth._sum.amount ?? 0),
        count: thisMonth._count,
      },
      byMethod: byMethod.map((b) => ({
        method: b.method,
        amount: Number(b._sum.amount ?? 0),
        count: b._count,
      })),
    };
  }

  constructWebhookEvent(payload: Buffer, sig: string): any {
    return this.stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  }
}
