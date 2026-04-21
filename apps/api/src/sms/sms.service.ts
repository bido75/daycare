import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListSmsLogsDto } from './sms.dto';
import { SmsProviderFactory } from './providers/provider-factory';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: SmsProviderFactory,
  ) {}

  async sendSms(
    to: string,
    message: string,
    sentById: string,
    studentId?: string,
    context?: string,
  ) {
    const log = await this.prisma.smsLog.create({
      data: {
        to,
        from: 'pending',
        body: message,
        status: 'created',
        sentById: sentById !== 'system' ? sentById : undefined,
        studentId,
        context,
      },
    });

    const provider = await this.providerFactory.getDefaultProvider(context);

    const providerRecord = context
      ? await this.prisma.smsProvider.findFirst({
          where: { isActive: true, contexts: { has: context } },
        })
      : await this.prisma.smsProvider.findFirst({
          where: { isActive: true, isDefault: true },
        });

    const result = await provider.sendSms({
      internalMessageId: log.id,
      to,
      body: message,
      attempt: 1,
      meta: { context },
    });

    const updated = await this.prisma.smsLog.update({
      where: { id: log.id },
      data: {
        from: result.provider,
        status: result.status,
        providerMessageId: result.providerMessageId,
        twilioSid: result.provider === 'twilio' ? result.providerMessageId : undefined,
        providerId: providerRecord?.id ?? undefined,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      },
    });

    return updated;
  }

  async sendBulkSms(
    recipients: string[],
    message: string,
    sentById: string,
    context?: string,
  ) {
    const results = await Promise.all(
      recipients.map((to) => this.sendSms(to, message, sentById, undefined, context)),
    );
    return { sent: results.length, results };
  }

  async getSmsLogs(filters: ListSmsLogsDto) {
    const { page = 1, limit = 20, status, recipient } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (recipient) where.to = { contains: recipient };

    const [total, logs] = await Promise.all([
      this.prisma.smsLog.count({ where }),
      this.prisma.smsLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { provider: { select: { name: true, displayName: true } } },
      }),
    ]);

    return { data: logs, total, page: Number(page), limit: Number(limit) };
  }

  // Automated SMS triggers
  async sendRegistrationApprovalSms(parentPhone: string, childName: string) {
    return this.sendSms(
      parentPhone,
      `Great news! ${childName}'s registration at Creative Kids Academy has been approved. Welcome to our family!`,
      'system',
      undefined,
      'general',
    );
  }

  async sendAttendanceAlertSms(parentPhone: string, childName: string, type: string) {
    return this.sendSms(
      parentPhone,
      `Attendance alert: ${childName} has been marked as ${type} today at Creative Kids Academy.`,
      'system',
      undefined,
      'attendance',
    );
  }

  async sendPaymentReminderSms(parentPhone: string, amount: string, dueDate: string) {
    return this.sendSms(
      parentPhone,
      `Reminder: A payment of $${amount} is due on ${dueDate} for Creative Kids Academy. Please log in to make your payment.`,
      'system',
      undefined,
      'general',
    );
  }
}
