import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsBoolean,
  IsEnum,
  IsNumber,
  Matches,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity';
import { PurchaseOrderInvoiceState } from '../entities/purchase-order-invoice.entity';

export class QueryPurchaseOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  clientName?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  invoiceNumber?: string;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsEnum(PurchaseOrderInvoiceState)
  invoiceState?: PurchaseOrderInvoiceState;

  @IsOptional()
  @IsIn(['01', '16', '19', '20'])
  paymentMethod?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return value === true || value === 'true';
  })
  @IsBoolean()
  shouldInvoice?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxTotal?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateFrom?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateTo?: string;
}
