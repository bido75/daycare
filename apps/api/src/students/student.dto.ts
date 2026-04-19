import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddEmergencyContactDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  relationship: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class AddAuthorizedPickupDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  relationship: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class ListStudentsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  classroomId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
