import { IsString, IsOptional, IsDateString, IsObject } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @IsString()
  classroomId: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsObject()
  schedule?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  emergencyContacts?: EmergencyContactDto[];

  @IsOptional()
  authorizedPickups?: AuthorizedPickupDto[];
}

export class EmergencyContactDto {
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

export class AuthorizedPickupDto {
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

export class UpdateRegistrationStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class ListRegistrationsDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
