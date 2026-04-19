import { IsString, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassroomDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  ageGroupMin: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  ageGroupMax: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity: number;

  @IsOptional()
  @IsString()
  leadStaffId?: string;
}

export class UpdateClassroomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  ageGroupMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  ageGroupMax?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity?: number;

  @IsOptional()
  @IsString()
  leadStaffId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignStudentDto {
  @IsString()
  studentId: string;
}

export class ListClassroomsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
