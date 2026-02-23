import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Role } from './entities/role.entity';
import { Module as ModuleEntity } from './entities/module.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { RoleModule } from './entities/role-module.entity';

import { RolesService } from './roles/roles.service';
import { RolesController } from './roles/roles.controller';
import { ModulesService } from './modules/modules.service';
import { ModulesController } from './modules/modules.controller';
import { PermissionsService } from './permissions/permissions.service';
import { PermissionsController } from './permissions/permissions.controller';

import { RolePermissionsService } from './services/role-permissions.service';
import { RolePermissionsController } from './controllers/role-permissions.controller';
import { RoleModulesService } from './services/role-modules.service';
import { RoleModulesController } from './controllers/role-modules.controller';
import { UserPermissionsService } from './services/user-permissions.service';

import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      ModuleEntity,
      Permission,
      RolePermission,
      RoleModule,
      User,
    ]),
  ],
  controllers: [
    RolesController,
    ModulesController,
    PermissionsController,
    RolePermissionsController,
    RoleModulesController,
  ],
  providers: [
    RolesService,
    ModulesService,
    PermissionsService,
    RolePermissionsService,
    RoleModulesService,
    UserPermissionsService,
  ],
  exports: [
    TypeOrmModule,
    RolesService,
    ModulesService,
    PermissionsService,
    RolePermissionsService,
    RoleModulesService,
    UserPermissionsService,
  ],
})
export class RolesPermissionsModule {}
