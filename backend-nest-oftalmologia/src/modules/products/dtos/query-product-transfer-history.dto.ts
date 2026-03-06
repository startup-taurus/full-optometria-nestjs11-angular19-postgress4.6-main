import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class QueryProductTransferHistoryDto {
  @IsOptional()
  @IsIn(['sent', 'received', 'all'])
  direction?: 'sent' | 'received' | 'all';

  @IsOptional()
  @IsUUID()
  productId?: string;
}
