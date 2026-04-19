import { IsString, IsOptional } from 'class-validator';

export class ListParentsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
