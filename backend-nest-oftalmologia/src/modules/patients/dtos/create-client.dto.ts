import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateClientDto {
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
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  documentNumber: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  mobilePhone?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  homePhone?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  address?: string;

  @IsOptional()
  @IsUUID('4')
  patientId?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  patientIds?: string[];
}
