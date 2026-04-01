import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { LaboratoryOrderStatus } from '../entities/laboratory-order.entity';

export class ChangeStatusDto {
  @IsNotEmpty()
  @IsEnum(LaboratoryOrderStatus)
  status: LaboratoryOrderStatus;

  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;
}
