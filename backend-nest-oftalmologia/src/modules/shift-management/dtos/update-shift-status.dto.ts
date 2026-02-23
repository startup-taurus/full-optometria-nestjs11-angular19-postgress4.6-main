import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateShiftStatusDto } from './create-shift-status.dto';

export class UpdateShiftStatusDto extends PartialType(CreateShiftStatusDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
