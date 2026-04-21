import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsProviderInterface } from './sms-provider.interface';
import { ClickSendSmsProvider, ClickSendConfig } from './clicksend.provider';
import { TwilioSmsProvider, TwilioConfig } from './twilio.provider';

@Injectable()
export class SmsProviderFactory {
  constructor(private readonly prisma: PrismaService) {}

  getProvider(name: 'twilio' | 'clicksend', config: any): SmsProviderInterface {
    if (name === 'clicksend') {
      return new ClickSendSmsProvider(config as ClickSendConfig);
    }
    return new TwilioSmsProvider(config as TwilioConfig);
  }

  async getDefaultProvider(context?: string): Promise<SmsProviderInterface> {
    let record: any = null;

    if (context) {
      record = await this.prisma.smsProvider.findFirst({
        where: {
          isActive: true,
          contexts: { has: context },
        },
      });
    }

    if (!record) {
      record = await this.prisma.smsProvider.findFirst({
        where: { isActive: true, isDefault: true },
      });
    }

    if (!record) {
      record = await this.prisma.smsProvider.findFirst({
        where: { isActive: true },
      });
    }

    if (record) {
      return this.getProvider(record.name as 'twilio' | 'clicksend', record.config);
    }

    // Fall back to env-based Twilio config
    return new TwilioSmsProvider({
      accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
      authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
      fromNumber: process.env.TWILIO_FROM_NUMBER ?? '',
    });
  }

  async getProviderById(id: string): Promise<SmsProviderInterface | null> {
    const record = await this.prisma.smsProvider.findUnique({ where: { id } });
    if (!record) return null;
    return this.getProvider(record.name as 'twilio' | 'clicksend', record.config);
  }
}
