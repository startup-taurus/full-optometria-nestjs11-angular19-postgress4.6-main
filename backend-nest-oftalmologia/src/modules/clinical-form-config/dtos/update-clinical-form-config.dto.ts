import { PartialType } from '@nestjs/mapped-types';
import { CreateClinicalFormConfigDto } from './create-clinical-form-config.dto';

export class UpdateClinicalFormConfigDto extends PartialType(
  CreateClinicalFormConfigDto
) {}
