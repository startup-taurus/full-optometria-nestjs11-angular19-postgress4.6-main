import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsBoolean,
  IsUUID,
  IsEmail,
  ValidateIf,
  IsInt,
  Min,
  Matches,
} from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^\d+$/)
  code?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ValidateIf((o) => o.logoFileId !== null && o.logoFileId !== undefined)
  @IsUUID()
  logoFileId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxBranches?: number | null;
}
