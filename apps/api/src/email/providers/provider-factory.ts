import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailProviderInterface } from './email-provider.interface';
import { ResendEmailProvider } from './resend.provider';
import { SmtpEmailProvider } from './smtp.provider';

@Injectable()
export class EmailProviderFactory {
  constructor(private readonly prisma: PrismaService) {}

  getProvider(name: string, config: any): EmailProviderInterface {
    if (name === 'smtp') {
      return new SmtpEmailProvider(config);
    }
    // Default: resend (also covers 'resend', 'sendgrid-future', etc.)
    return new ResendEmailProvider(config);
  }

  async getDefaultProvider(context?: string): Promise<EmailProviderInterface> {
    let record: any = null;

    if (context) {
      record = await this.prisma.emailProvider.findFirst({
        where: { isActive: true, contexts: { has: context } },
      });
    }

    if (!record) {
      record = await this.prisma.emailProvider.findFirst({
        where: { isActive: true, isDefault: true },
      });
    }

    if (!record) {
      record = await this.prisma.emailProvider.findFirst({
        where: { isActive: true },
      });
    }

    if (record) {
      return this.getProvider(record.name, record.config);
    }

    // Fall back to env vars
    return new ResendEmailProvider({
      apiKey: process.env.RESEND_API_KEY ?? 're_xxx',
      fromEmail: process.env.EMAIL_FROM ?? 'noreply@creativekidsacademy.com',
      fromName: 'Creative Kids Academy',
    });
  }

  async getProviderById(id: string): Promise<EmailProviderInterface | null> {
    const record = await this.prisma.emailProvider.findUnique({ where: { id } });
    if (!record) return null;
    return this.getProvider(record.name, record.config);
  }
}
