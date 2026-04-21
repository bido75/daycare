import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { SmsProviderFactory } from './providers/provider-factory';
import { ClickSendWebhookController } from './webhooks/clicksend-webhook.controller';
import { TwilioWebhookController } from './webhooks/twilio-webhook.controller';
import { IntegrationService } from './integration/integration.service';
import { IntegrationController } from './integration/integration.controller';

@Module({
  imports: [PrismaModule],
  providers: [SmsService, SmsProviderFactory, IntegrationService],
  controllers: [
    SmsController,
    ClickSendWebhookController,
    TwilioWebhookController,
    IntegrationController,
  ],
  exports: [SmsService],
})
export class SmsModule {}
