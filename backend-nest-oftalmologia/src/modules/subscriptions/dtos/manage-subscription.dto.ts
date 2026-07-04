import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MANAGEABLE_STATUSES } from './list-subscriptions.query.dto';

export class ManageSubscriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  planCode?: string;

  @IsOptional()
  @IsIn(MANAGEABLE_STATUSES as unknown as string[])
  status?: string;

  @IsOptional()
  @IsISO8601()
  currentPeriodEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  billingCycle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;
}

export class ReactivateSubscriptionDto {
  @IsOptional()
  @IsISO8601()
  currentPeriodEnd?: string;
}

// Activar/desactivar la EMPRESA. Desactivarla NO cancela el cobro (eso es otra
// acción): bloquea el acceso de todos sus usuarios (no podrán iniciar sesión).
export class SetCompanyActiveDto {
  @IsBoolean()
  isActive: boolean;
}
