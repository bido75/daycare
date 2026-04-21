import { Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { EmailProviderInterface, EmailRequest, EmailResult } from './email-provider.interface';

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

export class SendGridEmailProvider implements EmailProviderInterface {
  private readonly logger = new Logger(SendGridEmailProvider.name);
  private readonly isDevMode: boolean;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly config: SendGridConfig) {
    this.fromEmail = config.fromEmail || 'noreply@creativekidsacademy.com';
    this.fromName = config.fromName || 'Creative Kids Academy';
    this.isDevMode =
      !config.apiKey ||
      config.apiKey === 'SG_xxx' ||
      config.apiKey.length < 10;

    if (this.isDevMode) {
      this.logger.warn('SendGrid running in DEV MODE — emails will be logged, not sent');
    } else {
      sgMail.setApiKey(config.apiKey);
    }
  }

  async sendEmail(request: EmailRequest): Promise<EmailResult> {
    const from = request.from ?? `${this.fromName} <${this.fromEmail}>`;
    const to = Array.isArray(request.to) ? request.to : [request.to];

    if (this.isDevMode) {
      this.logger.log(
        `[DEV SendGrid] To: ${to.join(', ')} | Subject: ${request.subject} | From: ${from}`,
      );
      return { success: true, messageId: `dev_sg_${Date.now()}` };
    }

    try {
      const [response] = await sgMail.send({
        from,
        to,
        subject: request.subject,
        html: request.html,
        text: request.text,
        replyTo: request.replyTo,
      });

      return { success: true, messageId: response.headers['x-message-id'] as string | undefined };
    } catch (err: any) {
      const message = err?.response?.body?.errors?.[0]?.message ?? err.message ?? 'SendGrid error';
      this.logger.error(`SendGrid exception: ${message}`);
      return { success: false, error: message };
    }
  }
}
