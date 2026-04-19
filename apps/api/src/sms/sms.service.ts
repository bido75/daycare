import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListSmsLogsDto } from './sms.dto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const TwilioSDK = require('twilio') as typeof import('twilio');
type TwilioClient = import('twilio').Twilio;

const DEV_PLACEHOLDERS = ['ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'test', 'placeholder', ''];

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: TwilioClient | null = null;
  private fromNumber: string;
  private isDevMode: boolean;

  constructor(private prisma: PrismaService) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID ?? '';
    const authToken = process.env.TWILIO_AUTH_TOKEN ?? '';
    this.fromNumber = process.env.TWILIO_FROM_NUMBER ?? '';

    this.isDevMode = DEV_PLACEHOLDERS.some(
      (p) => accountSid.includes(p) || authToken.includes(p) || accountSid.length < 10,
    );

    if (!this.isDevMode) {
      try {
        this.client = TwilioSDK(accountSid, authToken);
      } catch (err) {
        this.logger.warn('Failed to initialize Twilio client — falling back to dev mode');
        this.isDevMode = true;
      }
    } else {
      this.logger.warn('Twilio running in DEV MODE — SMS will be logged, not sent');
    }
  }

  async sendSms(to: string, message: string, sentById: string, studentId?: string) {
    let status = 'sent';
    let twilioSid: string | undefined;
    let errorCode: string | undefined;
    let errorMessage: string | undefined;

    if (this.isDevMode) {
      this.logger.log(`[DEV SMS] To: ${to} | Message: ${message}`);
      status = 'dev_logged';
    } else {
      try {
        const msg = await this.client!.messages.create({
          to,
          from: this.fromNumber,
          body: message,
        });
        twilioSid = msg.sid;
        status = msg.status;
      } catch (err: any) {
        this.logger.error(`Twilio error: ${err.message}`);
        status = 'failed';
        errorCode = err.code?.toString();
        errorMessage = err.message;
      }
    }

    const log = await this.prisma.smsLog.create({
      data: {
        to,
        from: this.fromNumber || 'dev',
        body: message,
        status,
        twilioSid,
        errorCode,
        errorMessage,
      },
    });

    return log;
  }

  async sendBulkSms(recipients: string[], message: string, sentById: string) {
    const results = await Promise.all(
      recipients.map((to) => this.sendSms(to, message, sentById)),
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
    );
  }

  async sendAttendanceAlertSms(parentPhone: string, childName: string, type: string) {
    return this.sendSms(
      parentPhone,
      `Attendance alert: ${childName} has been marked as ${type} today at Creative Kids Academy.`,
      'system',
    );
  }

  async sendPaymentReminderSms(parentPhone: string, amount: string, dueDate: string) {
    return this.sendSms(
      parentPhone,
      `Reminder: A payment of $${amount} is due on ${dueDate} for Creative Kids Academy. Please log in to make your payment.`,
      'system',
    );
  }
}
