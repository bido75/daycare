import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ClickSendDlrPayload {
  message_id?: string;
  custom_string?: string;
  status?: string;
  error_text?: string;
  timestamp?: string;
  to?: string;
}

interface ClickSendInboundPayload {
  from?: string;
  message?: string;
  to?: string;
  message_id?: string;
  timestamp?: string;
}

@Controller('webhooks/clicksend')
export class ClickSendWebhookController {
  private readonly logger = new Logger(ClickSendWebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('dlr')
  @HttpCode(HttpStatus.OK)
  async handleDeliveryReceipt(@Body() payload: ClickSendDlrPayload) {
    this.logger.log(`ClickSend DLR received: ${JSON.stringify(payload)}`);

    const { message_id, custom_string, status } = payload;

    let smsStatus = 'sent_to_provider';
    if (status === 'Delivered') smsStatus = 'delivered';
    else if (status === 'Failed') smsStatus = 'failed';
    else if (status === 'Undeliverable') smsStatus = 'undeliverable';

    // Try finding by providerMessageId or custom_string (internalMessageId)
    const where: any = {};
    if (message_id) where.providerMessageId = message_id.toString();

    let log = message_id
      ? await this.prisma.smsLog.findFirst({ where })
      : null;

    if (!log && custom_string) {
      log = await this.prisma.smsLog.findUnique({ where: { id: custom_string } });
    }

    if (log) {
      await this.prisma.smsLog.update({
        where: { id: log.id },
        data: {
          status: smsStatus,
          errorMessage: payload.error_text || undefined,
        },
      });
      this.logger.log(`Updated SmsLog ${log.id} → ${smsStatus}`);
    } else {
      this.logger.warn(`ClickSend DLR: no SmsLog found for message_id=${message_id}, custom_string=${custom_string}`);
    }

    return { received: true };
  }

  @Post('inbound')
  @HttpCode(HttpStatus.OK)
  async handleInbound(@Body() payload: ClickSendInboundPayload) {
    this.logger.log(`ClickSend inbound SMS: from=${payload.from}, body=${payload.message}`);
    // Store inbound for future use
    return { received: true };
  }
}
