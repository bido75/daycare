import { Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { EmailProviderInterface, EmailRequest, EmailResult } from './email-provider.interface';

export interface SesConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  fromEmail: string;
  fromName?: string;
}

export class SesEmailProvider implements EmailProviderInterface {
  private readonly logger = new Logger(SesEmailProvider.name);
  private readonly client: SESClient | null;
  private readonly isDevMode: boolean;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly config: SesConfig) {
    this.fromEmail = config.fromEmail || 'noreply@creativekidsacademy.com';
    this.fromName = config.fromName || 'Creative Kids Academy';
    this.isDevMode =
      !config.accessKeyId ||
      config.accessKeyId === 'AKIAIOSFODNN7EXAMPLE' ||
      config.accessKeyId.trim() === '';

    if (this.isDevMode) {
      this.logger.warn('Amazon SES running in DEV MODE — emails will be logged, not sent');
      this.client = null;
    } else {
      this.client = new SESClient({
        region: config.region || 'us-east-1',
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
    }
  }

  async sendEmail(request: EmailRequest): Promise<EmailResult> {
    const from = request.from ?? `${this.fromName} <${this.fromEmail}>`;
    const toAddresses = Array.isArray(request.to) ? request.to : [request.to];

    if (this.isDevMode) {
      this.logger.log(
        `[DEV SES] To: ${toAddresses.join(', ')} | Subject: ${request.subject} | From: ${from}`,
      );
      return { success: true, messageId: `dev_ses_${Date.now()}` };
    }

    try {
      const command = new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: toAddresses },
        Message: {
          Subject: { Data: request.subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: request.html, Charset: 'UTF-8' },
            ...(request.text ? { Text: { Data: request.text, Charset: 'UTF-8' } } : {}),
          },
        },
        ...(request.replyTo ? { ReplyToAddresses: [request.replyTo] } : {}),
      });

      const response = await this.client!.send(command);
      return { success: true, messageId: response.MessageId };
    } catch (err: any) {
      this.logger.error(`SES exception: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
