import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientDto } from './create-patient.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Transform(() => undefined)
  companyId?: never;

  @Transform(() => undefined)
  branchId?: never;
}
