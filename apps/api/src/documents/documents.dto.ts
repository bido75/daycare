import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum DocumentType {
  BIRTH_CERT = 'BIRTH_CERT',
  IMMUNIZATION = 'IMMUNIZATION',
  MEDICAL = 'MEDICAL',
  ID_CARD = 'ID_CARD',
  ENROLLMENT_FORM = 'ENROLLMENT_FORM',
  OTHER = 'OTHER',
}

export class UploadDocumentDto {
  @IsString()
  studentId: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class ListDocumentsDto {
  @IsString()
  @IsOptional()
  studentId?: string;

  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}

export class VerifyDocumentDto {
  @IsBoolean()
  verified: boolean;
}
