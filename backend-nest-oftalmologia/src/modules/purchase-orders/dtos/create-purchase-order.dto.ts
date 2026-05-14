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
  shouldInvoice?: boolean = true;

  @IsDecimal()
  @IsOptional()
  totalAmount?: number;
}
