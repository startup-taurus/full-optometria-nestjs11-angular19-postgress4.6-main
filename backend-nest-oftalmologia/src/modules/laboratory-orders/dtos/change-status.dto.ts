import { IsBoolean, IsIn, IsNotEmpty, IsOptional } from 'class-validator';
import { LaboratoryOrderStatus } from '../entities/laboratory-order.entity';

const ALLOWED_LABORATORY_STATUSES = [
  LaboratoryOrderStatus.PENDING,
  LaboratoryOrderStatus.SENT,
  LaboratoryOrderStatus.RECEIVED,
  LaboratoryOrderStatus.DELIVERED,
  LaboratoryOrderStatus.CANCELLED,
] as const;

export class ChangeStatusDto {
  @IsNotEmpty()
  @IsIn(ALLOWED_LABORATORY_STATUSES as readonly string[])
  status: LaboratoryOrderStatus;

  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;
}
