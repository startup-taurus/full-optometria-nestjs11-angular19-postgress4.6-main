import {
  IsString,
  IsUUID,
  IsDateString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateShiftDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
