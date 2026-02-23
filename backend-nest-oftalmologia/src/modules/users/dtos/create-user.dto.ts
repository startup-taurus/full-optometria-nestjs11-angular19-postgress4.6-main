import {
  IsString,
  IsEmail,
  IsUUID,
  IsOptional,
  MinLength,
  IsDateString,
  IsISO8601,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsUUID()
  roleId: string;

  @IsOptional()
  @IsUUID()
  companyId?: string | null;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsString()
  @MinLength(1)
  documentNumber: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  document_number?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  dateOfBirth?: string;

  @IsString()
  mobilePhone: string;

  @IsOptional()
  @IsString()
  mobile_phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  adress?: string;

  @IsOptional()
  @IsString()
  homePhone?: string;

  @IsOptional()
  @IsString()
  home_phone?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;
}
