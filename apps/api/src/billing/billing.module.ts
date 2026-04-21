import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { SettingsModule } from '../settings/settings.module';

import { FeeTypesService } from './fee-types.service';
import { FeeTypesController } from './fee-types.controller';

import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

import { ReceiptsService } from './receipts.service';
import { ReceiptsController } from './receipts.controller';

@Module({
  imports: [EmailModule, SettingsModule],
  controllers: [
    FeeTypesController,
    InvoicesController,
    PaymentsController,
    ReceiptsController,
  ],
  providers: [
    FeeTypesService,
    InvoicesService,
    PaymentsService,
    ReceiptsService,
  ],
  exports: [FeeTypesService, InvoicesService, PaymentsService, ReceiptsService],
})
export class BillingModule {}
