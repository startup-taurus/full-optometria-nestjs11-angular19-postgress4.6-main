import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class AssignPermissionToRoleDto {
  @IsUUID()
  roleId: string;

  @IsUUID()
  permissionId: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean = true;
}
