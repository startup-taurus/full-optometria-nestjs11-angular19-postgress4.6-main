import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { RoleModule } from '../entities/role-module.entity';

@Injectable()
export class UserPermissionsService {
  private readonly logger = new Logger(UserPermissionsService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(RoleModule)
    private roleModuleRepository: Repository<RoleModule>
  ) {}

  async getUserPermissions(userId: string) {
    this.logger.log(`Getting permissions for user: ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user || !user.role) {
      this.logger.warn(`User ${userId} not found or has no role`);
      return {
        messageKey: 'USER.PROFILE_FETCHED',
        data: {
          user,
          permissions: [],
          modules: [],
        },
      };
    }

    // Obtener permisos del usuario
    const rolePermissions = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.permission', 'permission')
      .leftJoinAndSelect('permission.module', 'module')
      .where('rp.roleId = :roleId', { roleId: user.role.id })
      .andWhere('rp.isEnabled = :isEnabled', { isEnabled: true })
      .andWhere('permission.isActive = :isActive', { isActive: true })
      .getMany();

    // Obtener módulos del usuario
    const roleModules = await this.roleModuleRepository
      .createQueryBuilder('rm')
      .leftJoinAndSelect('rm.module', 'module')
      .where('rm.roleId = :roleId', { roleId: user.role.id })
      .andWhere('rm.isEnabled = :isEnabled', { isEnabled: true })
      .andWhere('module.isActive = :isActive', { isActive: true })
      .getMany();

    return {
      messageKey: 'USER.PROFILE_FETCHED',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          role: user.role,
        },
        permissions: rolePermissions.map((rp) => ({
          id: rp.permission.id,
          permissionName: rp.permission.permissionName,
          description: rp.permission.description,
          module: rp.permission.module,
        })),
        modules: roleModules.map((rm) => ({
          id: rm.module.id,
          moduleName: rm.module.moduleName,
          description: rm.module.description,
        })),
      },
    };
  }
}
