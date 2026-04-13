import { IsIn, IsInt } from 'class-validator';

export class CreatePurchaseOrderInvoiceDto {
  @IsIn(['01', '16', '19', '20'])
  paymentMethod: string;

  @IsInt()
  @IsIn([0, 5, 12, 13, 14, 15])
  taxPercent: number;
}
