import { PartialType } from '@nestjs/mapped-types';
import { CreateLaboratoryOrderDto } from './create-laboratory-order.dto';

export class UpdateLaboratoryOrderDto extends PartialType(
  CreateLaboratoryOrderDto
) {}
