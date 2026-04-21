import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const INCIDENT_TYPES = ['injury', 'behavior', 'illness', 'accident', 'other'];
const SEVERITY_LEVELS = ['low', 'medium', 'high'];
const STATUS_VALUES = ['OPEN', 'RESOLVED', 'CLOSED'];

export class CreateIncidentDto {
  @IsString()
  studentId: string;

  @IsIn(INCIDENT_TYPES)
  type: string;

  @IsIn(SEVERITY_LEVELS)
  severity: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  actionTaken?: string;

  @IsBoolean()
  @IsOptional()
  parentNotified?: boolean;

  @IsDateString()
  occurredAt: string;
}

export class UpdateIncidentDto {
  @IsString()
  @IsOptional()
  actionTaken?: string;

  @IsBoolean()
  @IsOptional()
  parentNotified?: boolean;

  @IsIn(STATUS_VALUES)
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  resolvedAt?: string;
}

export class ListIncidentsDto {
  @IsString()
  @IsOptional()
  studentId?: string;

  @IsIn(SEVERITY_LEVELS)
  @IsOptional()
  severity?: string;

  @IsIn(STATUS_VALUES)
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  dateFrom?: string;

  @IsString()
  @IsOptional()
  dateTo?: string;

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
