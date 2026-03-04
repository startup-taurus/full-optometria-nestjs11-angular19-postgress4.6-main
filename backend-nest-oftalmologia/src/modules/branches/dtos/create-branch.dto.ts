import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  Length,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateBranchDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  code: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  address: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  city: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  corporateEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  openingHours?: string;
}
