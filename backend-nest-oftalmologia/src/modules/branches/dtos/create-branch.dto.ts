import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  Length,
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

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  corporateEmail?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  openingHours?: string;
}
