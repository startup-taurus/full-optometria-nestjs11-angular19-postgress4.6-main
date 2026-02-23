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
import { RoleModulesService } from '../services/role-modules.service';
import { AssignModuleToRoleDto } from '../dtos/assign-module-role.dto';
@Controller('role-modules')
@UseGuards(AuthGuard('jwt'))
export class RoleModulesController {
  constructor(private readonly roleModulesService: RoleModulesService) {}
  @Post('assign')
  async assignModuleToRole(
    @Body(ValidationPipe) assignDto: AssignModuleToRoleDto
  ) {
    return this.roleModulesService.assignModuleToRole(assignDto);
  }
  @Delete('remove/:roleId/:moduleId')
  async removeModuleFromRole(
    @Param('roleId') roleId: string,
    @Param('moduleId') moduleId: string
  ) {
    return this.roleModulesService.removeModuleFromRole(roleId, moduleId);
  }
  @Get('role/:roleId')
  async getRoleModules(@Param('roleId') roleId: string) {
    return this.roleModulesService.getRoleModules(roleId);
  }
  @Get('all')
  async getAllRoleModules() {
    return this.roleModulesService.getAllRoleModules();
  }
}
