import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  IsArray,
  IsDateString,
  ValidateNested,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Fee Types ───────────────────────────────────────────────────────────────

export class CreateFeeTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsIn(['ONE_TIME', 'WEEKLY', 'MONTHLY', 'ANNUAL'])
  frequency: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateFeeTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsIn(['ONE_TIME', 'WEEKLY', 'MONTHLY', 'ANNUAL'])
  frequency?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListFeeTypesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  active?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export class InvoiceItemDto {
  @IsOptional()
  @IsString()
  feeTypeId?: string;

  @IsString()
  description: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsString()
  studentId?: string;
}

export class CreateInvoiceDto {
  @IsString()
  parentProfileId: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'VOID'])
  status?: string;
}

export class ListInvoicesDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class BulkCreateInvoiceDto {
  @IsArray()
  @IsString({ each: true })
  parentIds: string[];

  @IsString()
  feeTypeId: string;

  @IsDateString()
  dueDate: string;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export class CreatePaymentIntentDto {
  @IsString()
  invoiceId: string;
}

export class RecordManualPaymentDto {
  @IsString()
  invoiceId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsIn(['CASH', 'CHECK', 'BANK_TRANSFER'])
  method: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ListPaymentsDto {
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class RefundPaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

// ─── Receipts ─────────────────────────────────────────────────────────────────

export class ListReceiptsDto {
  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
