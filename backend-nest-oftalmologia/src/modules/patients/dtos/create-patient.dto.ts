import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

const CURRENT_YEAR = new Date().getFullYear();

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  documentNumber?: string;

  @IsString()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string | null;

  @IsInt()
  @IsOptional()
  @Min(1900)
  @Max(CURRENT_YEAR)
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? null : Number(value)
  )
  birthYear?: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  homePhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  mobilePhone?: string;

  @IsString()
  @IsOptional()
  profilePhoto?: string;
}
