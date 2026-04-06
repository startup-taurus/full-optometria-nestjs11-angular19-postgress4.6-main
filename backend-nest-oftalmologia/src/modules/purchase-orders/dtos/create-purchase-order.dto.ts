import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDecimal,
} from 'class-validator';

export class CreatePurchaseOrderDto {
  @IsUUID()
  @IsNotEmpty()
  laboratoryOrderId: string;

  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsBoolean()
  @IsOptional()
  shouldInvoice?: boolean = false;

  @IsDecimal()
  @IsOptional()
  totalAmount?: number;
}
