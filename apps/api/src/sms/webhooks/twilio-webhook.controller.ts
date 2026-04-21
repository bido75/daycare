import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface TwilioStatusPayload {
  MessageSid?: string;
  MessageStatus?: string;
  To?: string;
  From?: string;
  ErrorCode?: string;
  ErrorMessage?: string;
}

interface TwilioInboundPayload {
  From?: string;
  To?: string;
  Body?: string;
  MessageSid?: string;
}

const TWILIO_STATUS_MAP: Record<string, string> = {
  queued: 'queued',
  sent: 'sent_to_provider',
  delivered: 'delivered',
  undelivered: 'undeliverable',
  failed: 'failed',
};

@Controller('webhooks/twilio')
export class TwilioWebhookController {
  private readonly logger = new Logger(TwilioWebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('status')
  @HttpCode(HttpStatus.OK)
  async handleStatus(@Body() payload: TwilioStatusPayload) {
    this.logger.log(`Twilio status callback: SID=${payload.MessageSid}, status=${payload.MessageStatus}`);

    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = payload;

    if (!MessageSid) return { received: true };

    const smsStatus = TWILIO_STATUS_MAP[MessageStatus?.toLowerCase() ?? ''] ?? 'sent_to_provider';

    const log = await this.prisma.smsLog.findFirst({
      where: {
        OR: [
          { twilioSid: MessageSid },
          { providerMessageId: MessageSid },
        ],
      },
    });

    if (log) {
      await this.prisma.smsLog.update({
        where: { id: log.id },
        data: {
          status: smsStatus,
          errorCode: ErrorCode || undefined,
          errorMessage: ErrorMessage || undefined,
        },
      });
      this.logger.log(`Updated SmsLog ${log.id} → ${smsStatus}`);
    } else {
      this.logger.warn(`Twilio status: no SmsLog found for SID=${MessageSid}`);
    }

    return { received: true };
  }

  @Post('inbound')
  @HttpCode(HttpStatus.OK)
  async handleInbound(@Body() payload: TwilioInboundPayload) {
    this.logger.log(`Twilio inbound SMS: from=${payload.From}, body=${payload.Body}`);
    return { received: true };
  }
}
