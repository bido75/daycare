import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailProviderInterface, EmailRequest, EmailResult } from './email-provider.interface';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName?: string;
  encryption?: 'tls' | 'ssl' | 'none';
}

export class SmtpEmailProvider implements EmailProviderInterface {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isDevMode: boolean;

  constructor(private readonly config: SmtpConfig) {
    this.fromEmail = config.fromEmail || 'noreply@creativekidsacademy.com';
    this.fromName = config.fromName || 'Creative Kids Academy';
    this.isDevMode = !config.host || !config.user;

    if (this.isDevMode) {
      this.logger.warn('SMTP running in DEV MODE — emails will be logged, not sent');
    }

    const secure = config.encryption === 'ssl';
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port || 587,
      secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      tls: config.encryption === 'none' ? { rejectUnauthorized: false } : undefined,
    });
  }

  async sendEmail(request: EmailRequest): Promise<EmailResult> {
    const from = request.from ?? `${this.fromName} <${this.fromEmail}>`;
    const to = Array.isArray(request.to) ? request.to.join(', ') : request.to;

    if (this.isDevMode) {
      this.logger.log(
        `[DEV SMTP] To: ${to} | Subject: ${request.subject} | From: ${from}`,
      );
      return { success: true, messageId: `dev_smtp_${Date.now()}` };
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: request.subject,
        html: request.html,
        text: request.text,
        replyTo: request.replyTo,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      this.logger.error(`SMTP error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
