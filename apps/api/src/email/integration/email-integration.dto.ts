import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EmailProviderConfigDto {
  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  fromEmail?: string;

  @IsOptional()
  @IsString()
  fromName?: string;

  // SMTP fields
  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  port?: number;

  @IsOptional()
  @IsString()
  user?: string;

  @IsOptional()
  @IsString()
  pass?: string;

  @IsOptional()
  @IsString()
  encryption?: string;
}

export class CreateEmailProviderDto {
  @IsString()
  @IsIn(['resend', 'smtp', 'sendgrid', 'ses'])
  name: string;

  @IsString()
  displayName: string;

  @IsObject()
  @ValidateNested()
  @Type(() => EmailProviderConfigDto)
  config: EmailProviderConfigDto;

  @IsArray()
  @IsString({ each: true })
  contexts: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateEmailProviderDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EmailProviderConfigDto)
  config?: EmailProviderConfigDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contexts?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TestEmailProviderDto {
  @IsString()
  testEmail: string;
}
