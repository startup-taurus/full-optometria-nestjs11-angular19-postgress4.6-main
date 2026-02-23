import { PartialType } from '@nestjs/mapped-types';
import { CreateClinicalHistoryDto } from './create-clinical-history.dto';

export class UpdateClinicalHistoryDto extends PartialType(
  CreateClinicalHistoryDto
) {}
