import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class TransferProductStockDto {
  @IsUUID()
  @IsNotEmpty()
  destinationBranchId: string;

  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
