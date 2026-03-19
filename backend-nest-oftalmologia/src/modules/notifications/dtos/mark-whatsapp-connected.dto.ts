import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkWhatsAppConnectedDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  connectedPhone?: string;
}
