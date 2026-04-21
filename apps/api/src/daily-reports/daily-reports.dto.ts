import { IsString, IsOptional, IsDateString, IsObject, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDailyReportDto {
  @IsString() studentId: string;
  @IsDateString() date: string;
  @IsOptional() @IsString() mood?: string;
  @IsOptional() @IsObject() meals?: Record<string, any>;
  @IsOptional() @IsObject() naps?: Record<string, any>;
  @IsOptional() @IsObject() activities?: Record<string, any>;
  @IsOptional() @IsObject() toileting?: Record<string, any>;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) photoUrls?: string[];
}

export class UpdateDailyReportDto {
  @IsOptional() @IsString() mood?: string;
  @IsOptional() @IsObject() meals?: Record<string, any>;
  @IsOptional() @IsObject() naps?: Record<string, any>;
  @IsOptional() @IsObject() activities?: Record<string, any>;
  @IsOptional() @IsObject() toileting?: Record<string, any>;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) photoUrls?: string[];
}

export class ListDailyReportsDto {
  @IsOptional() @IsString() studentId?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() classroomId?: string;
  @IsOptional() @Type(() => Number) page?: number;
  @IsOptional() @Type(() => Number) limit?: number;
}
