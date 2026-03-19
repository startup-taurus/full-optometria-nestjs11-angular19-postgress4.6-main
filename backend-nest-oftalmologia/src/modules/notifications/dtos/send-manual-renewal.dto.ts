import { ArrayNotEmpty, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendManualRenewalDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  patientIds: string[];

  @IsOptional()
  @IsString()
  messageTemplate?: string;
}
