import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { QueryRoleDto } from './dtos/query-role.dto';
import { PaginationUtil } from '../../../common/utils/pagination.util';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const { roleName, companyId } = createRoleDto;

    const existingRole = await this.roleRepository.findOne({
      where: {
        roleName,
        companyId: companyId || null,
      },
    });

    if (existingRole) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: 'Role name already exists in this company',
      });
    }

    const role = this.roleRepository.create(createRoleDto);
    const savedRole = await this.roleRepository.save(role);

    return {
      messageKey: 'ROLE.CREATED',
      data: savedRole,
    };
  }

  async findAll(queryDto: QueryRoleDto, userCompanyId: string | null) {
    const { page, limit, search, isActive } = queryDto;
    const { skip, take } = PaginationUtil.getSkipAndTake({ page, limit });

    const queryBuilder = this.roleRepository.createQueryBuilder('role');

    if (userCompanyId !== null) {
      queryBuilder.where('role.companyId = :companyId', {
        companyId: userCompanyId,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(role.roleName ILIKE :search OR role.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('role.isActive = :isActive', { isActive });
    }

    const totalCount = await queryBuilder.getCount();

    const roles = await queryBuilder
      .orderBy('role.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    const paginatedResult = PaginationUtil.paginate(roles, totalCount, {
      page,
      limit,
    });

    return {
      messageKey: 'ROLE.FOUND',
      data: paginatedResult,
    };
  }

  async findOne(id: string) {
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    return {
      messageKey: 'ROLE.FETCHED',
      data: role,
    };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    const { roleName } = updateRoleDto;

    if (roleName && roleName !== role.roleName) {
      const existingRole = await this.roleRepository.findOne({
        where: { roleName },
      });
      if (existingRole) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: 'Role name already exists',
        });
      }
    }

    const { companyId: _, ...safeUpdateData } = updateRoleDto as any;
    await this.roleRepository.update(id, safeUpdateData);

    const updatedRole = await this.roleRepository.findOne({
      where: { id },
    });

    return {
      messageKey: 'ROLE.UPDATED',
      data: updatedRole,
    };
  }

  async remove(id: string) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users', 'rolePermissions', 'roleModules'],
    });

    if (!role) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    if (role.users && role.users.length > 0) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el rol ${role.roleName} porque tiene ${
            role.users.length
          } usuario${role.users.length > 1 ? 's' : ''} asociado${
            role.users.length > 1 ? 's' : ''
          }. Primero reasigne o elimine los usuarios.`,
          en: `Cannot delete role ${role.roleName} because it has ${
            role.users.length
          } associated user${
            role.users.length > 1 ? 's' : ''
          }. Please reassign or delete the users first.`,
        },
      });
    }

    if (role.rolePermissions && role.rolePermissions.length > 0) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el rol ${role.roleName} porque tiene ${
            role.rolePermissions.length
          } permiso${role.rolePermissions.length > 1 ? 's' : ''} asignado${
            role.rolePermissions.length > 1 ? 's' : ''
          }. Primero elimine los permisos del rol.`,
          en: `Cannot delete role ${role.roleName} because it has ${
            role.rolePermissions.length
          } assigned permission${
            role.rolePermissions.length > 1 ? 's' : ''
          }. Please remove the role permissions first.`,
        },
      });
    }

    if (role.roleModules && role.roleModules.length > 0) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el rol ${role.roleName} porque tiene ${
            role.roleModules.length
          } módulo${role.roleModules.length > 1 ? 's' : ''} asignado${
            role.roleModules.length > 1 ? 's' : ''
          }. Primero elimine los módulos del rol.`,
          en: `Cannot delete role ${role.roleName} because it has ${
            role.roleModules.length
          } assigned module${
            role.roleModules.length > 1 ? 's' : ''
          }. Please remove the role modules first.`,
        },
      });
    }

    await this.roleRepository.remove(role);

    return {
      messageKey: 'ROLE.DELETED',
      data: { id },
    };
  }

  async findByName(roleName: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { roleName },
    });
  }
}
