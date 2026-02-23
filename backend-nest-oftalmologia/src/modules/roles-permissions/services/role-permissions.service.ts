import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from '../entities/role-permission.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { AssignPermissionToRoleDto } from '../dtos/assign-permission-role.dto';

@Injectable()
export class RolePermissionsService {
  constructor(
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>
  ) {}

  async assignPermissionToRole(assignDto: AssignPermissionToRoleDto) {
    const { roleId, permissionId, isEnabled = true } = assignDto;

    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Role not found',
      });
    }

    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Permission not found',
      });
    }

    let existingAssignment = await this.rolePermissionRepository.findOne({
      where: { roleId, permissionId },
    });

    if (existingAssignment) {
      existingAssignment.isEnabled = isEnabled;
      await this.rolePermissionRepository.save(existingAssignment);

      return {
        messageKey: 'ROLE_PERMISSION.UPDATED',
        data: existingAssignment,
      };
    } else {
      const newAssignment = this.rolePermissionRepository.create({
        roleId,
        permissionId,
        isEnabled,
      });

      const savedAssignment = await this.rolePermissionRepository.save(
        newAssignment
      );

      return {
        messageKey: 'ROLE_PERMISSION.ASSIGNED',
        data: savedAssignment,
      };
    }
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    const assignment = await this.rolePermissionRepository.findOne({
      where: { roleId, permissionId },
    });

    if (!assignment) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Assignment not found',
      });
    }

    await this.rolePermissionRepository.remove(assignment);

    return {
      messageKey: 'ROLE_PERMISSION.REMOVED',
    };
  }

  async getRolePermissions(roleId: string) {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Role not found',
      });
    }

    const rolePermissions = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.permission', 'permission')
      .leftJoinAndSelect('permission.module', 'module')
      .where('rp.roleId = :roleId', { roleId })
      .getMany();

    return {
      messageKey: 'ROLE_PERMISSION.FOUND',
      data: rolePermissions.map(rp => ({
        id: rp.permission.id,
        permissionName: rp.permission.permissionName,
        description: rp.permission.description,
        isActive: rp.permission.isActive,
        moduleId: rp.permission.moduleId,
        module: rp.permission.module,
        isEnabled: rp.isEnabled,
        isActiveForRole: rp.isEnabled,
      })),
    };
  }

  async getRolePermissionsByModule(roleId: string, moduleId?: string) {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Role not found',
      });
    }

    let queryBuilder = this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.module', 'module')
      .leftJoin('permission.rolePermissions', 'rp', 'rp.roleId = :roleId AND rp.permissionId = permission.id', { roleId })
      .where('permission.isActive = :isActive', { isActive: true })
      .addSelect(['rp.isEnabled', 'rp.roleId', 'rp.permissionId']);

    if (moduleId) {
      queryBuilder = queryBuilder.andWhere('permission.moduleId = :moduleId', { moduleId });
    }

    const permissions = await queryBuilder.getMany();

    return {
      messageKey: 'ROLE_PERMISSION.FOUND',
      data: {
        result: permissions.map(permission => {
          const rolePermission = permission.rolePermissions?.find(rp => 
            rp.roleId === roleId && rp.permissionId === permission.id
          );
          
          return {
            id: permission.id,
            permissionName: permission.permissionName,
            description: permission.description,
            isActive: permission.isActive,
            moduleId: permission.moduleId,
            module: permission.module,
 
            isActiveForRole: rolePermission?.isEnabled || false,
            isEnabled: rolePermission?.isEnabled || false,
          };
        }),
        totalCount: permissions.length,
      },
    };
  }

  async getAllRolePermissions() {
    const rolePermissions = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.role', 'role')
      .leftJoinAndSelect('rp.permission', 'permission')
      .leftJoinAndSelect('permission.module', 'module')
      .getMany();

    return {
      messageKey: 'ROLE_PERMISSION.FOUND',
      data: rolePermissions,
    };
  }
}
