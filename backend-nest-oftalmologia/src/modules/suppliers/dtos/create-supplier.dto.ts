import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  Length,
} from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  documentNumber: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  phone: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
