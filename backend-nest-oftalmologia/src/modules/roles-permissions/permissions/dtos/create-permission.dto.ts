import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @MinLength(2)
  permissionName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  moduleId: string;
}
