import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadFileDto {
  @IsString()
  entityType: string;

  @IsUUID()
  entityId: string;

  @IsOptional()
  @IsString()
  fileCategory?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isCover?: boolean;
}
