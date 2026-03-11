import { IsEnum, IsNumber, IsOptional, Min, Max, ValidateIf } from 'class-validator';
import { DiscountType } from '../entities/product-discount.entity';
import { Type } from 'class-transformer';

export class CreateApplyDiscountDto {
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @ValidateIf((obj) => obj.discountType === DiscountType.PERCENTAGE)
  @Max(100)
  @Type(() => Number)
  discountValue: number;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean = true;
}
