import { IsString, IsOptional, MinLength, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  roleName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string | null;
}
