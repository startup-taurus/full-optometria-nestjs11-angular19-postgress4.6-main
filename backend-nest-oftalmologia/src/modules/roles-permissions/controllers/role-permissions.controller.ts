import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolePermissionsService } from '../services/role-permissions.service';
import { AssignPermissionToRoleDto } from '../dtos/assign-permission-role.dto';
@Controller('role-permissions')
@UseGuards(AuthGuard('jwt'))
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService
  ) {}
  @Post('assign')
  async assignPermissionToRole(
    @Body(ValidationPipe) assignDto: AssignPermissionToRoleDto
  ) {
    return this.rolePermissionsService.assignPermissionToRole(assignDto);
  }
  @Delete('remove/:roleId/:permissionId')
  async removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string
  ) {
    return this.rolePermissionsService.removePermissionFromRole(
      roleId,
      permissionId
    );
  }
  @Get('role/:roleId')
  async getRolePermissions(@Param('roleId') roleId: string) {
    return this.rolePermissionsService.getRolePermissions(roleId);
  }

  @Get('role/:roleId/module/:moduleId')
  async getRolePermissionsByModule(
    @Param('roleId') roleId: string,
    @Param('moduleId') moduleId: string
  ) {
    return this.rolePermissionsService.getRolePermissionsByModule(roleId, moduleId);
  }
  @Get('all')
  async getAllRolePermissions() {
    return this.rolePermissionsService.getAllRolePermissions();
  }
}
