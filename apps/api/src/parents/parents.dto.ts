import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ListParentsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class UpdateParentProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zip?: string;
}

export class UpdateParentPreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  dailyReportUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  attendanceAlerts?: boolean;
}

