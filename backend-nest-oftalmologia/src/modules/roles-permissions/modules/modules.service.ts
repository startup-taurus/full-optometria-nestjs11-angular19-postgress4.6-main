import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module } from '../entities/module.entity';
import { CreateModuleDto } from './dtos/create-module.dto';
import { UpdateModuleDto } from './dtos/update-module.dto';
import { QueryModuleDto } from './dtos/query-module.dto';
import { PaginationUtil } from '../../../common/utils/pagination.util';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>
  ) {}

  async create(createModuleDto: CreateModuleDto) {
    const { moduleName } = createModuleDto;

    const existingModule = await this.moduleRepository.findOne({
      where: { moduleName },
    });

    if (existingModule) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: 'Module name already exists',
      });
    }

    const module = this.moduleRepository.create(createModuleDto);
    const savedModule = await this.moduleRepository.save(module);

    return {
      messageKey: 'MODULE.CREATED',
      data: savedModule,
    };
  }

  async findAll(queryDto: QueryModuleDto) {
    const { page, limit, search, isActive } = queryDto;
    const { skip, take } = PaginationUtil.getSkipAndTake({ page, limit });

    const queryBuilder = this.moduleRepository.createQueryBuilder('module');

    if (search) {
      queryBuilder.andWhere(
        '(module.moduleName ILIKE :search OR module.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('module.isActive = :isActive', { isActive });
    }

    const totalCount = await queryBuilder.getCount();

    const modules = await queryBuilder
      .orderBy('module.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    const paginatedResult = PaginationUtil.paginate(modules, totalCount, {
      page,
      limit,
    });

    return {
      messageKey: 'MODULE.FOUND',
      data: paginatedResult,
    };
  }

  async findOne(id: string) {
    const module = await this.moduleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!module) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    return {
      messageKey: 'MODULE.FETCHED',
      data: module,
    };
  }

  async update(id: string, updateModuleDto: UpdateModuleDto) {
    const module = await this.moduleRepository.findOne({ where: { id } });

    if (!module) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    const { moduleName } = updateModuleDto;

    if (moduleName && moduleName !== module.moduleName) {
      const existingModule = await this.moduleRepository.findOne({
        where: { moduleName },
      });
      if (existingModule) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: 'Module name already exists',
        });
      }
    }

    await this.moduleRepository.update(id, updateModuleDto);

    const updatedModule = await this.moduleRepository.findOne({
      where: { id },
    });

    return {
      messageKey: 'MODULE.UPDATED',
      data: updatedModule,
    };
  }

  async remove(id: string) {
    const module = await this.moduleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!module) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    if (module.permissions && module.permissions.length > 0) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el módulo ${
            module.moduleName
          } porque tiene ${module.permissions.length} permiso${
            module.permissions.length > 1 ? 's' : ''
          } asociado${
            module.permissions.length > 1 ? 's' : ''
          }. Primero elimine los permisos.`,
          en: `Cannot delete module ${module.moduleName} because it has ${
            module.permissions.length
          } associated permission${
            module.permissions.length > 1 ? 's' : ''
          }. Please delete the permissions first.`,
        },
      });
    }

    await this.moduleRepository.remove(module);

    return {
      messageKey: 'MODULE.DELETED',
      data: { id },
    };
  }
}
