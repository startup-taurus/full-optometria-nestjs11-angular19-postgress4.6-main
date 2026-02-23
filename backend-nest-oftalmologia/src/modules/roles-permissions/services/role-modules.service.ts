import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleModule } from '../entities/role-module.entity';
import { Role } from '../entities/role.entity';
import { Module as ModuleEntity } from '../entities/module.entity';
import { AssignModuleToRoleDto } from '../dtos/assign-module-role.dto';

@Injectable()
export class RoleModulesService {
  constructor(
    @InjectRepository(RoleModule)
    private roleModuleRepository: Repository<RoleModule>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(ModuleEntity)
    private moduleRepository: Repository<ModuleEntity>
  ) {}

  async assignModuleToRole(assignDto: AssignModuleToRoleDto) {
    const { roleId, moduleId, isEnabled = true } = assignDto;

    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Role not found',
      });
    }

    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
    });
    if (!module) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Module not found',
      });
    }

    let existingAssignment = await this.roleModuleRepository.findOne({
      where: { roleId, moduleId },
    });

    if (existingAssignment) {
      existingAssignment.isEnabled = isEnabled;
      await this.roleModuleRepository.save(existingAssignment);

      return {
        messageKey: 'ROLE_MODULE.UPDATED',
        data: existingAssignment,
      };
    } else {
      const newAssignment = this.roleModuleRepository.create({
        roleId,
        moduleId,
        isEnabled,
      });

      const savedAssignment = await this.roleModuleRepository.save(
        newAssignment
      );

      return {
        messageKey: 'ROLE_MODULE.ASSIGNED',
        data: savedAssignment,
      };
    }
  }

  async removeModuleFromRole(roleId: string, moduleId: string) {
    const assignment = await this.roleModuleRepository.findOne({
      where: { roleId, moduleId },
    });

    if (!assignment) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Assignment not found',
      });
    }

    await this.roleModuleRepository.remove(assignment);

    return {
      messageKey: 'ROLE_MODULE.REMOVED',
    };
  }

  async getRoleModules(roleId: string) {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Role not found',
      });
    }

    const roleModules = await this.roleModuleRepository
      .createQueryBuilder('rm')
      .leftJoinAndSelect('rm.module', 'module')
      .where('rm.roleId = :roleId', { roleId })
      .getMany();

    return {
      messageKey: 'ROLE_MODULE.FOUND',
      data: {
        role,
        modules: roleModules,
      },
    };
  }

  async getAllRoleModules() {
    const roleModules = await this.roleModuleRepository
      .createQueryBuilder('rm')
      .leftJoinAndSelect('rm.role', 'role')
      .leftJoinAndSelect('rm.module', 'module')
      .getMany();

    return {
      messageKey: 'ROLE_MODULE.FOUND',
      data: roleModules,
    };
  }
}
