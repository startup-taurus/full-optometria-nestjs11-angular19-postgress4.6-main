import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryFeedbackDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  type?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  status?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  branchId?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  companyId?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  createdByUserId?: string;
}
