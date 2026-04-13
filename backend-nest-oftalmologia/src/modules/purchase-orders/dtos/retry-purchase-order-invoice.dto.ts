import { IsIn, IsInt, IsOptional } from 'class-validator';

export class RetryPurchaseOrderInvoiceDto {
  @IsOptional()
  @IsIn(['01', '16', '19', '20'])
  paymentMethod?: string;

  @IsOptional()
  @IsInt()
  @IsIn([0, 5, 12, 13, 14, 15])
  taxPercent?: number;
}
