import { IsString, IsOptional, IsIn, IsDateString, IsArray, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckInDto {
  @IsString() studentId: string;
  @IsString() classroomId: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsIn(['MANUAL', 'QR_KIOSK']) method?: 'MANUAL' | 'QR_KIOSK';
}

export class CheckOutDto {
  @IsString() attendanceId: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsIn(['MANUAL', 'QR_KIOSK']) method?: 'MANUAL' | 'QR_KIOSK';
}

export class QrCheckInDto {
  @IsString() qrToken: string;
  @IsString() classroomId: string;
}

export class QrCheckOutDto {
  @IsString() qrToken: string;
}

export class ListAttendanceDto {
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() classroomId?: string;
  @IsOptional() @IsString() studentId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) limit?: number;
}

export class MarkAbsentDto {
  @IsString() studentId: string;
  @IsString() classroomId: string;
  @IsDateString() date: string;
  @IsOptional() @IsString() notes?: string;
}

export class BulkCheckInDto {
  @IsArray() @IsString({ each: true }) studentIds: string[];
  @IsString() classroomId: string;
}

export class AttendanceStatsDto {
  @IsOptional() @IsString() classroomId?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}
