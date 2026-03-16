import { IsOptional, IsUUID } from 'class-validator';

export class QueryProductHistoryDto {
  @IsOptional()
  @IsUUID()
  productId?: string;
}
