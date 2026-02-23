import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  Length,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  code: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  subcategoryId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  brand: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  unitPrice: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  quantity: number;

  @IsOptional()
  @IsString()
  @IsUUID()
  defaultSupplierId?: string;
}
