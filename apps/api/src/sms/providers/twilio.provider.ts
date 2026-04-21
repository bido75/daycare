import { Logger } from '@nestjs/common';
import {
  SmsProviderInterface,
  OutboundSmsRequest,
  OutboundSmsResult,
} from './sms-provider.interface';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const TwilioSDK = require('twilio') as typeof import('twilio');
type TwilioClient = import('twilio').Twilio;

const DEV_PLACEHOLDERS = ['ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'ACxxx', 'test', 'placeholder', ''];

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export class TwilioSmsProvider implements SmsProviderInterface {
  private readonly logger = new Logger(TwilioSmsProvider.name);
  private client: TwilioClient | null = null;
  private readonly isDevMode: boolean;

  constructor(private readonly config: TwilioConfig) {
    this.isDevMode = DEV_PLACEHOLDERS.some(
      (p) =>
        config.accountSid.includes(p) ||
        config.authToken.includes(p) ||
        config.accountSid.length < 10,
    );

    if (!this.isDevMode) {
      try {
        this.client = TwilioSDK(config.accountSid, config.authToken);
      } catch (err) {
        this.logger.warn('Failed to initialize Twilio client — falling back to dev mode');
      }
    } else {
      this.logger.warn('Twilio running in DEV MODE — SMS will be logged, not sent');
    }
  }

  async sendSms(message: OutboundSmsRequest): Promise<OutboundSmsResult> {
    if (this.isDevMode || !this.client) {
      this.logger.log(
        `[DEV Twilio] To: ${message.to} | Body: ${message.body} | ID: ${message.internalMessageId}`,
      );
      return {
        internalMessageId: message.internalMessageId,
        to: message.to,
        status: 'sent_to_provider',
        provider: 'twilio',
        providerMessageId: `dev_${Date.now()}`,
      };
    }

    try {
      const msg = await this.client.messages.create({
        to: message.to,
        from: this.config.fromNumber,
        body: message.body,
      });

      return {
        internalMessageId: message.internalMessageId,
        to: message.to,
        status: 'sent_to_provider',
        provider: 'twilio',
        providerMessageId: msg.sid,
      };
    } catch (err: any) {
      this.logger.error(`Twilio error: ${err.message}`);
      return {
        internalMessageId: message.internalMessageId,
        to: message.to,
        status: 'failed',
        provider: 'twilio',
        errorCode: err.code?.toString(),
        errorMessage: err.message,
      };
    }
  }
}
