import { Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailProviderInterface, EmailRequest, EmailResult } from './email-provider.interface';

export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

export class ResendEmailProvider implements EmailProviderInterface {
  private readonly logger = new Logger(ResendEmailProvider.name);
  private readonly resend: Resend | null;
  private readonly isDevMode: boolean;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly config: ResendConfig) {
    this.fromEmail = config.fromEmail || 'noreply@creativekidsacademy.com';
    this.fromName = config.fromName || 'Creative Kids Academy';
    this.isDevMode =
      !config.apiKey ||
      config.apiKey === 're_xxx' ||
      config.apiKey.length < 8;

    if (this.isDevMode) {
      this.logger.warn('Resend running in DEV MODE — emails will be logged, not sent');
      this.resend = null;
    } else {
      this.resend = new Resend(config.apiKey);
    }
  }

  async sendEmail(request: EmailRequest): Promise<EmailResult> {
    const from = request.from ?? `${this.fromName} <${this.fromEmail}>`;
    const to = Array.isArray(request.to) ? request.to : [request.to];

    if (this.isDevMode) {
      this.logger.log(
        `[DEV Resend] To: ${to.join(', ')} | Subject: ${request.subject} | From: ${from}`,
      );
      return { success: true, messageId: `dev_${Date.now()}` };
    }

    try {
      const response = await this.resend!.emails.send({
        from,
        to,
        subject: request.subject,
        html: request.html,
        text: request.text,
        replyTo: request.replyTo,
      });

      if (response.error) {
        this.logger.error(`Resend error: ${response.error.message}`);
        return { success: false, error: response.error.message };
      }

      return { success: true, messageId: response.data?.id };
    } catch (err: any) {
      this.logger.error(`Resend exception: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
