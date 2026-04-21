import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from './email.service';
import { EmailProviderFactory } from './providers/provider-factory';
import { EmailIntegrationService } from './integration/email-integration.service';
import { EmailIntegrationController } from './integration/email-integration.controller';

@Module({
  imports: [PrismaModule],
  providers: [EmailService, EmailProviderFactory, EmailIntegrationService],
  controllers: [EmailIntegrationController],
  exports: [EmailService, EmailProviderFactory],
})
export class EmailModule {}
