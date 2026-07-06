import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SyncSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  externalSubscriptionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  status?: string;

  @IsOptional()
  @IsISO8601()
  currentPeriodEnd?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  cardBrand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  cardLast4?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountCents?: number;
}
