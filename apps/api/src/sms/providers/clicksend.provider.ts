import { Logger } from '@nestjs/common';
import axios from 'axios';
import {
  SmsProviderInterface,
  OutboundSmsRequest,
  OutboundSmsResult,
} from './sms-provider.interface';

export interface ClickSendConfig {
  username: string;
  apiKey: string;
  fromNumber: string;
}

export class ClickSendSmsProvider implements SmsProviderInterface {
  private readonly logger = new Logger(ClickSendSmsProvider.name);
  private readonly isDevMode: boolean;

  constructor(private readonly config: ClickSendConfig) {
    this.isDevMode =
      !config.username ||
      config.username.includes('test') ||
      !config.apiKey ||
      config.apiKey.length < 8;

    if (this.isDevMode) {
      this.logger.warn('ClickSend running in DEV MODE — SMS will be logged, not sent');
    }
  }

  async sendSms(message: OutboundSmsRequest): Promise<OutboundSmsResult> {
    if (this.isDevMode) {
      this.logger.log(
        `[DEV ClickSend] To: ${message.to} | Body: ${message.body} | ID: ${message.internalMessageId}`,
      );
      return {
        internalMessageId: message.internalMessageId,
        to: message.to,
        status: 'sent_to_provider',
        provider: 'clicksend',
        providerMessageId: `dev_${Date.now()}`,
      };
    }

    try {
      const payload = {
        messages: [
          {
            to: message.to,
            body: message.body,
            from: this.config.fromNumber || undefined,
            custom_string: message.internalMessageId,
          },
        ],
      };

      const response = await axios.post(
        'https://rest.clicksend.com/v3/sms/send',
        payload,
        {
          auth: {
            username: this.config.username,
            password: this.config.apiKey,
          },
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        },
      );

      const result = response.data?.data?.messages?.[0];
      const status = result?.status;

      if (status === 'SUCCESS') {
        return {
          internalMessageId: message.internalMessageId,
          to: message.to,
          status: 'sent_to_provider',
          provider: 'clicksend',
          providerMessageId: result.message_id?.toString(),
        };
      }

      return {
        internalMessageId: message.internalMessageId,
        to: message.to,
        status: 'failed',
        provider: 'clicksend',
        errorCode: status,
        errorMessage: result?.error_text || 'ClickSend rejected message',
      };
    } catch (err: any) {
      this.logger.error(`ClickSend error: ${err.message}`);
      return {
        internalMessageId: message.internalMessageId,
        to: message.to,
        status: 'failed',
        provider: 'clicksend',
        errorCode: err.response?.status?.toString() ?? 'NETWORK_ERROR',
        errorMessage: err.response?.data?.response_msg ?? err.message,
      };
    }
  }
}
