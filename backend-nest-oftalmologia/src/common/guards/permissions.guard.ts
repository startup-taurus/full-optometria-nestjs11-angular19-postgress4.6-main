import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { User } from '../../modules/users/entities/user.entity';
import { RolePermission } from '../../modules/roles-permissions/entities/role-permission.entity';
import { Permission } from '../../modules/roles-permissions/entities/permission.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user || !user.role) {
      return false;
    }

    const rolePermissions = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.permission', 'permission')
      .where('rp.roleId = :roleId', { roleId: user.role.id })
      .andWhere('rp.isEnabled = :isEnabled', { isEnabled: true })
      .andWhere('permission.isActive = :isActive', { isActive: true })
      .getMany();

    const userPermissions = rolePermissions.map(
      (rp) => rp.permission.permissionName
    );

    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );
  }
}
