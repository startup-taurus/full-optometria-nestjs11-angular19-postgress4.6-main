import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dtos/create-branch.dto';
import { UpdateBranchDto } from './dtos/update-branch.dto';
import { QueryBranchDto } from './dtos/query-branch.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { CompanyFilterUtil } from '../../common/utils/company-filter.util';
import { CompanyQuotaService } from '../company-quota/company-quota.service';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    private quotaService: CompanyQuotaService
  ) {}

  async create(createBranchDto: CreateBranchDto) {
    const { companyId, name, code } = createBranchDto;

    if (companyId) {
      await this.quotaService.checkBranchQuota(companyId);
    }

    const existingByName = await this.branchRepository.findOne({
      where: { name, companyId },
    });

    if (existingByName) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: 'Ya existe una sucursal con este nombre en esta compañia',
          en: 'A branch with this name already exists in this company',
        },
      });
    }

    const existingByCode = await this.branchRepository.findOne({
      where: { code, companyId },
    });

    if (existingByCode) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: 'Ya existe una sucursal con este código en esta compañia',
          en: 'A branch with this code already exists in this company',
        },
      });
    }

    const branchPayload: CreateBranchDto = {
      ...createBranchDto,
      openingHours: this.normalizeOpeningHours(createBranchDto.openingHours),
    };

    const branch = this.branchRepository.create(branchPayload);
    const savedBranch = await this.branchRepository.save(branch);

    return {
      statusCode: 201,
      success: true,
      message: {
        es: 'Sucursal creada exitosamente',
        en: 'Branch created successfully',
      },
      data: savedBranch,
    };
  }

  async findAll(queryDto: QueryBranchDto, companyId: string | null) {
    const { skip, take } = PaginationUtil.getSkipAndTake(queryDto);
    const queryBuilder = this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.company', 'company');

    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'branch', companyId);

    if (queryDto.search) {
      queryBuilder.andWhere(
        '(branch.name ILIKE :search OR branch.code ILIKE :search OR branch.city ILIKE :search)',
        { search: `%${queryDto.search}%` }
      );
    }

    if (queryDto.name) {
      queryBuilder.andWhere('branch.name ILIKE :name', {
        name: `%${queryDto.name}%`,
      });
    }

    if (queryDto.code) {
      queryBuilder.andWhere('branch.code ILIKE :code', {
        code: `%${queryDto.code}%`,
      });
    }

    if (queryDto.city) {
      queryBuilder.andWhere('branch.city ILIKE :city', {
        city: `%${queryDto.city}%`,
      });
    }

    if (queryDto.phone) {
      queryBuilder.andWhere('branch.phone ILIKE :phone', {
        phone: `%${queryDto.phone}%`,
      });
    }

    if (queryDto.corporateEmail) {
      queryBuilder.andWhere('branch.corporateEmail ILIKE :corporateEmail', {
        corporateEmail: `%${queryDto.corporateEmail}%`,
      });
    }

    if (queryDto.address) {
      queryBuilder.andWhere('branch.address ILIKE :address', {
        address: `%${queryDto.address}%`,
      });
    }

    if (queryDto.isActive !== undefined) {
      queryBuilder.andWhere('branch.isActive = :isActive', {
        isActive: queryDto.isActive,
      });
    }

    queryBuilder.orderBy('branch.createdAt', 'DESC').skip(skip).take(take);

    const [branches, totalCount] = await queryBuilder.getManyAndCount();

    const paginationResult = PaginationUtil.paginate(
      branches,
      totalCount,
      queryDto
    );

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Sucursales obtenidas exitosamente',
        en: 'Branches retrieved successfully',
      },
      data: paginationResult,
    };
  }

  async findAllForSelector(companyId: string | null) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { isActive: true },
      companyId
    );

    const branches = await this.branchRepository.find({
      where: whereCondition,
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Sucursales obtenidas exitosamente',
        en: 'Branches retrieved successfully',
      },
      data: branches,
    };
  }

  async findOne(id: string, companyId: string | null) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id },
      companyId
    );

    const branch = await this.branchRepository.findOne({
      where: whereCondition,
      relations: ['company'],
    });

    if (!branch) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Sucursal no encontrada',
          en: 'Branch not found',
        },
      });
    }

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Sucursal obtenida exitosamente',
        en: 'Branch retrieved successfully',
      },
      data: branch,
    };
  }

  async update(
    id: string,
    updateBranchDto: UpdateBranchDto,
    companyId: string | null
  ) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id },
      companyId
    );

    const branch = await this.branchRepository.findOne({
      where: whereCondition,
    });

    if (!branch) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Sucursal no encontrada',
          en: 'Branch not found',
        },
      });
    }

    if (updateBranchDto.name && updateBranchDto.name !== branch.name) {
      const existingByName = await this.branchRepository.findOne({
        where: { name: updateBranchDto.name },
      });

      if (existingByName) {
        throw new ConflictException({
          statusCode: 409,
          success: false,
          message: {
            es: 'Ya existe una sucursal con este nombre',
            en: 'A branch with this name already exists',
          },
        });
      }
    }

    if (updateBranchDto.code && updateBranchDto.code !== branch.code) {
      const existingByCode = await this.branchRepository.findOne({
        where: { code: updateBranchDto.code },
      });

      if (existingByCode) {
        throw new ConflictException({
          statusCode: 409,
          success: false,
          message: {
            es: 'Ya existe una sucursal con este código',
            en: 'A branch with this code already exists',
          },
        });
      }
    }

    const { companyId: _, ...safeUpdateData } = updateBranchDto as any;

    if (Object.prototype.hasOwnProperty.call(safeUpdateData, 'openingHours')) {
      safeUpdateData.openingHours = this.normalizeOpeningHours(
        safeUpdateData.openingHours
      );
    }

    Object.assign(branch, safeUpdateData);
    const updatedBranch = await this.branchRepository.save(branch);

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Sucursal actualizada exitosamente',
        en: 'Branch updated successfully',
      },
      data: updatedBranch,
    };
  }

  async remove(id: string, companyId: string | null) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id },
      companyId
    );

    const branch = await this.branchRepository.findOne({
      where: whereCondition,
    });

    if (!branch) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Sucursal no encontrada',
          en: 'Branch not found',
        },
      });
    }

    const usersCount = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin('users', 'user', 'user.branch_id = branch.id')
      .where('branch.id = :id', { id })
      .select('COUNT(user.id)', 'count')
      .getRawOne();

    if (parseInt(usersCount.count) > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la sucursal ${branch.name} porque tiene ${
            usersCount.count
          } usuario${parseInt(usersCount.count) > 1 ? 's' : ''} asociado${
            parseInt(usersCount.count) > 1 ? 's' : ''
          }. Primero elimine o reasigne los usuarios.`,
          en: `Cannot delete branch ${branch.name} because it has ${
            usersCount.count
          } associated user${
            parseInt(usersCount.count) > 1 ? 's' : ''
          }. Please delete or reassign the users first.`,
        },
      });
    }

    const categoriesCount = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin('categories', 'category', 'category.branch_id = branch.id')
      .where('branch.id = :id', { id })
      .select('COUNT(category.id)', 'count')
      .getRawOne();

    if (parseInt(categoriesCount.count) > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la sucursal ${branch.name} porque tiene ${
            categoriesCount.count
          } categoría${
            parseInt(categoriesCount.count) > 1 ? 's' : ''
          } asociada${
            parseInt(categoriesCount.count) > 1 ? 's' : ''
          }. Primero elimine las categorías.`,
          en: `Cannot delete branch ${branch.name} because it has ${
            categoriesCount.count
          } associated categor${
            parseInt(categoriesCount.count) > 1 ? 'ies' : 'y'
          }. Please delete the categories first.`,
        },
      });
    }

    const subcategoriesCount = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin(
        'subcategories',
        'subcategory',
        'subcategory.branch_id = branch.id'
      )
      .where('branch.id = :id', { id })
      .select('COUNT(subcategory.id)', 'count')
      .getRawOne();

    if (parseInt(subcategoriesCount.count) > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la sucursal ${branch.name} porque tiene ${
            subcategoriesCount.count
          } subcategoría${
            parseInt(subcategoriesCount.count) > 1 ? 's' : ''
          } asociada${
            parseInt(subcategoriesCount.count) > 1 ? 's' : ''
          }. Primero elimine las subcategorías.`,
          en: `Cannot delete branch ${branch.name} because it has ${
            subcategoriesCount.count
          } associated subcategor${
            parseInt(subcategoriesCount.count) > 1 ? 'ies' : 'y'
          }. Please delete the subcategories first.`,
        },
      });
    }

    const productsCount = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin('products', 'product', 'product.branch_id = branch.id')
      .where('branch.id = :id', { id })
      .select('COUNT(product.id)', 'count')
      .getRawOne();

    if (parseInt(productsCount.count) > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la sucursal ${branch.name} porque tiene ${
            productsCount.count
          } producto${parseInt(productsCount.count) > 1 ? 's' : ''} asociado${
            parseInt(productsCount.count) > 1 ? 's' : ''
          }. Primero elimine o reasigne los productos.`,
          en: `Cannot delete branch ${branch.name} because it has ${
            productsCount.count
          } associated product${
            parseInt(productsCount.count) > 1 ? 's' : ''
          }. Please delete or reassign the products first.`,
        },
      });
    }

    const suppliersCount = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin('suppliers', 'supplier', 'supplier.branch_id = branch.id')
      .where('branch.id = :id', { id })
      .select('COUNT(supplier.id)', 'count')
      .getRawOne();

    if (parseInt(suppliersCount.count) > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la sucursal ${branch.name} porque tiene ${
            suppliersCount.count
          } proveedor${
            parseInt(suppliersCount.count) > 1 ? 'es' : ''
          } asociado${
            parseInt(suppliersCount.count) > 1 ? 's' : ''
          }. Primero elimine o reasigne los proveedores.`,
          en: `Cannot delete branch ${branch.name} because it has ${
            suppliersCount.count
          } associated supplier${
            parseInt(suppliersCount.count) > 1 ? 's' : ''
          }. Please delete or reassign the suppliers first.`,
        },
      });
    }

    const shiftsCount = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin('shifts', 'shift', 'shift.branch_id = branch.id')
      .where('branch.id = :id', { id })
      .select('COUNT(shift.id)', 'count')
      .getRawOne();

    if (parseInt(shiftsCount.count) > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la sucursal ${branch.name} porque tiene ${
            shiftsCount.count
          } turno${parseInt(shiftsCount.count) > 1 ? 's' : ''} asociado${
            parseInt(shiftsCount.count) > 1 ? 's' : ''
          }. Primero elimine los turnos.`,
          en: `Cannot delete branch ${branch.name} because it has ${
            shiftsCount.count
          } associated shift${
            parseInt(shiftsCount.count) > 1 ? 's' : ''
          }. Please delete the shifts first.`,
        },
      });
    }

    const laboratoryOrdersCount = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin(
        'laboratory_orders',
        'laboratory_order',
        'laboratory_order.branch_id = branch.id'
      )
      .where('branch.id = :id', { id })
      .select('COUNT(laboratory_order.id)', 'count')
      .getRawOne();

    if (parseInt(laboratoryOrdersCount.count) > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la sucursal ${branch.name} porque tiene ${
            laboratoryOrdersCount.count
          } orden${
            parseInt(laboratoryOrdersCount.count) > 1 ? 'es' : ''
          } de laboratorio asociada${
            parseInt(laboratoryOrdersCount.count) > 1 ? 's' : ''
          }. Primero elimine las órdenes de laboratorio.`,
          en: `Cannot delete branch ${branch.name} because it has ${
            laboratoryOrdersCount.count
          } associated laboratory order${
            parseInt(laboratoryOrdersCount.count) > 1 ? 's' : ''
          }. Please delete the laboratory orders first.`,
        },
      });
    }

    const clinicalHistoriesCount = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin(
        'clinical_histories',
        'clinical_history',
        'clinical_history.branch_id = branch.id'
      )
      .where('branch.id = :id', { id })
      .select('COUNT(clinical_history.id)', 'count')
      .getRawOne();

    if (parseInt(clinicalHistoriesCount.count) > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la sucursal ${branch.name} porque tiene ${
            clinicalHistoriesCount.count
          } historia${
            parseInt(clinicalHistoriesCount.count) > 1 ? 's' : ''
          } clínica${
            parseInt(clinicalHistoriesCount.count) > 1 ? 's' : ''
          } asociada${
            parseInt(clinicalHistoriesCount.count) > 1 ? 's' : ''
          }. Primero elimine las historias clínicas.`,
          en: `Cannot delete branch ${branch.name} because it has ${
            clinicalHistoriesCount.count
          } associated clinical histor${
            parseInt(clinicalHistoriesCount.count) > 1 ? 'ies' : 'y'
          }. Please delete the clinical histories first.`,
        },
      });
    }

    const clinicalFormConfigsCount = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin(
        'clinical_form_configs',
        'clinical_form_config',
        'clinical_form_config.branch_id = branch.id'
      )
      .where('branch.id = :id', { id })
      .select('COUNT(clinical_form_config.id)', 'count')
      .getRawOne();

    if (parseInt(clinicalFormConfigsCount.count) > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la sucursal ${branch.name} porque tiene ${
            clinicalFormConfigsCount.count
          } configuración${
            parseInt(clinicalFormConfigsCount.count) > 1 ? 'es' : ''
          } de formulario${
            parseInt(clinicalFormConfigsCount.count) > 1 ? 's' : ''
          } clínico${
            parseInt(clinicalFormConfigsCount.count) > 1 ? 's' : ''
          } asociada${
            parseInt(clinicalFormConfigsCount.count) > 1 ? 's' : ''
          }. Primero elimine las configuraciones de formularios clínicos.`,
          en: `Cannot delete branch ${branch.name} because it has ${
            clinicalFormConfigsCount.count
          } associated clinical form config${
            parseInt(clinicalFormConfigsCount.count) > 1 ? 's' : ''
          }. Please delete the clinical form configs first.`,
        },
      });
    }

    await this.branchRepository.remove(branch);

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Sucursal eliminada exitosamente',
        en: 'Branch deleted successfully',
      },
    };
  }

  private normalizeOpeningHours(openingHours?: string): string | undefined {
    if (!openingHours?.trim()) {
      return undefined;
    }

    const rawValue = openingHours.trim();

    try {
      const parsedValue = JSON.parse(rawValue);
      const scheduleSource = Array.isArray(parsedValue)
        ? parsedValue
        : parsedValue?.weeklySchedule;

      if (!Array.isArray(scheduleSource) || scheduleSource.length !== 7) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: {
            es: 'El horario de atención tiene un formato inválido',
            en: 'Opening hours format is invalid',
          },
        });
      }

      const normalizedSchedule = scheduleSource
        .map((item) => this.normalizeScheduleDay(item))
        .sort((a, b) => a.day - b.day);

      const uniqueDays = new Set(normalizedSchedule.map((item) => item.day));
      if (uniqueDays.size !== 7) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: {
            es: 'El horario de atención debe incluir los 7 días de la semana',
            en: 'Opening hours must include all 7 days of the week',
          },
        });
      }

      return JSON.stringify(normalizedSchedule);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return rawValue;
    }
  }

  private normalizeScheduleDay(value: any): {
    day: number;
    enabled: boolean;
    startTime: string;
    endTime: string;
  } {
    const day = Number(value?.day);
    const enabled = Boolean(value?.enabled);
    const startTime = typeof value?.startTime === 'string' ? value.startTime : '';
    const endTime = typeof value?.endTime === 'string' ? value.endTime : '';

    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'El día del horario es inválido',
          en: 'Schedule day is invalid',
        },
      });
    }

    if (!this.isValidTimeFormat(startTime) || !this.isValidTimeFormat(endTime)) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'El formato de hora del horario es inválido',
          en: 'Schedule time format is invalid',
        },
      });
    }

    if (this.timeToMinutes(startTime) >= this.timeToMinutes(endTime)) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'La hora de inicio debe ser menor a la hora de fin',
          en: 'Start time must be earlier than end time',
        },
      });
    }

    return {
      day,
      enabled,
      startTime,
      endTime,
    };
  }

  private isValidTimeFormat(value: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
  }

  private timeToMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
