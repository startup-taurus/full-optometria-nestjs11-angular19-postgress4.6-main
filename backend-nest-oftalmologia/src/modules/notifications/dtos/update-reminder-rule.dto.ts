import { IsBoolean, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReminderRuleDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Min(1)
  @Max(168)
  appointmentReminderHoursBefore?: number;

  @IsOptional()
  @Min(30)
  @Max(1460)
  renewalAfterDays?: number;

  @IsOptional()
  @Min(1)
  @Max(120)
  renewalNotifyBeforeDays?: number;

  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @IsOptional()
  @IsString()
  quietHoursEnd?: string;
}
