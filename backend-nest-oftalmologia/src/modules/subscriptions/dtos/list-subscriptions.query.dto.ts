import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export const MANAGEABLE_STATUSES = [
  'active',
  'past_due',
  'paused',
  'canceled',
] as const;

export const LIST_STATUS_FILTERS = [...MANAGEABLE_STATUSES, 'none'] as const;

// Origen del cobro: 'landing' = suscripción tokenizada creada desde la landing
// (tiene external_subscription_id); 'manual' = alta manual por transferencia
// (tiene suscripción pero SIN external_subscription_id).
export const SOURCE_FILTERS = ['landing', 'manual'] as const;

export class ListSubscriptionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(LIST_STATUS_FILTERS as unknown as string[])
  status?: string;

  @IsOptional()
  @IsIn(SOURCE_FILTERS as unknown as string[])
  source?: string;

  // Estado de la EMPRESA (activa/inactiva), no de la suscripción.
  @IsOptional()
  @Transform(({ value }) =>
    value === true || value === 'true'
      ? true
      : value === false || value === 'false'
        ? false
        : undefined
  )
  @IsBoolean()
  active?: boolean;
}
