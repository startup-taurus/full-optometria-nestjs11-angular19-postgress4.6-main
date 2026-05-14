import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class QueryLaboratoryOrderDto {
  @IsOptional()
  @IsString()
  page?: number = 1;

  @IsOptional()
  @IsString()
  limit?: number = 10;

  @IsOptional()
  @IsUUID()
  patientFilterId?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;

  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
