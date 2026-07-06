import {
  IsEmail,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ProvisionSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  opticaName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  ownerName: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(120)
  adminEmail: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  documentId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  externalSubscriptionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  planCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  billingCycle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  cardBrand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  cardLast4?: string;

  @IsOptional()
  @IsISO8601()
  currentPeriodEnd?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  status?: string;
}
