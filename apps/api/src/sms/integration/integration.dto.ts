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

export class ProviderConfigDto {
  @IsOptional()
  @IsString()
  accountSid?: string;

  @IsOptional()
  @IsString()
  authToken?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  fromNumber?: string;
}

export class CreateProviderDto {
  @IsString()
  @IsIn(['twilio', 'clicksend'])
  name: string;

  @IsString()
  displayName: string;

  @IsObject()
  @ValidateNested()
  @Type(() => ProviderConfigDto)
  config: ProviderConfigDto;

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

export class UpdateProviderDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProviderConfigDto)
  config?: ProviderConfigDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contexts?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TestProviderDto {
  @IsString()
  testPhoneNumber: string;
}
