import { IsOptional, IsUUID } from 'class-validator';

export class QueryProductStockHistoryDto {
  @IsOptional()
  @IsUUID()
  productId?: string;
}
