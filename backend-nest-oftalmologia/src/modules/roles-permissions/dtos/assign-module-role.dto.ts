import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class AssignModuleToRoleDto {
  @IsUUID()
  roleId: string;

  @IsUUID()
  moduleId: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean = true;
}
