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
  @IsOptional()
  clientId?: string | null;

  @IsBoolean()
  @IsOptional()
  shouldInvoice?: boolean = false;

  @IsDecimal()
  @IsOptional()
  totalAmount?: number;
}
