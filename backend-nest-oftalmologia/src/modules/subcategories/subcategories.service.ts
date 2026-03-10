import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subcategory } from './entities/subcategory.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { CreateSubcategoryDto } from './dtos/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dtos/update-subcategory.dto';
import { QuerySubcategoryDto } from './dtos/query-subcategory.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectRepository(Subcategory)
    private subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>
  ) {}

  private normalizeName(value?: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private sanitizeName(value?: string): string {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  async create(
    createSubcategoryDto: CreateSubcategoryDto,
    branchId: string,
    companyId: string | null
  ) {
    const categoryWhereCondition: any = {
      id: createSubcategoryDto.categoryId,
      branchId,
    };
    if (companyId) {
      categoryWhereCondition.companyId = companyId;
    }

    const category = await this.categoryRepository.findOne({
      where: categoryWhereCondition,
    });

    if (!category) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'La categoría no existe o no pertenece a esta sucursal',
          en: 'Category does not exist or does not belong to this branch',
        },
      });
    }

    const normalizedName = this.normalizeName(createSubcategoryDto.name);
    const sanitizedName = this.sanitizeName(createSubcategoryDto.name);
    const subcategoryWhereCondition: any = {
      categoryId: createSubcategoryDto.categoryId,
      branchId,
    };
    if (companyId) {
      subcategoryWhereCondition.companyId = companyId;
    }

    const existingSubcategories = await this.subcategoryRepository.find({
      where: subcategoryWhereCondition,
      select: ['id', 'name'],
    });

    const existingSubcategory = existingSubcategories.find(
      (item) => this.normalizeName(item.name) === normalizedName
    );

    if (existingSubcategory) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: 'Ya existe una subcategoría con este nombre en esta categoría',
          en: 'A subcategory with this name already exists in this category',
        },
      });
    }

    const subcategory = this.subcategoryRepository.create({
      ...createSubcategoryDto,
      name: sanitizedName,
      branchId,
      companyId,
    });

    const savedSubcategory = await this.subcategoryRepository.save(subcategory);

    return {
      statusCode: 201,
      success: true,
      message: {
        es: 'Subcategoría creada exitosamente',
        en: 'Subcategory created successfully',
      },
      data: savedSubcategory,
    };
  }

  async findAll(
    queryDto: QuerySubcategoryDto,
    branchId: string,
    companyId: string | null
  ) {
    const { skip, take } = PaginationUtil.getSkipAndTake(queryDto);
    const queryBuilder = this.subcategoryRepository
      .createQueryBuilder('subcategory')
      .leftJoinAndSelect('subcategory.category', 'category');

    queryBuilder.where('subcategory.branchId = :branchId', { branchId });

    if (companyId) {
      queryBuilder.andWhere('subcategory.companyId = :companyId', {
        companyId,
      });
    }

    if (queryDto.categoryId) {
      queryBuilder.andWhere('subcategory.categoryId = :categoryId', {
        categoryId: queryDto.categoryId,
      });
    }

    if (queryDto.search) {
      queryBuilder.andWhere('subcategory.name ILIKE :search', {
        search: `%${queryDto.search}%`,
      });
    }

    if (queryDto.isActive !== undefined) {
      queryBuilder.andWhere('subcategory.isActive = :isActive', {
        isActive: queryDto.isActive,
      });
    }

    queryBuilder.orderBy('subcategory.createdAt', 'DESC').skip(skip).take(take);

    const [subcategories, totalCount] = await queryBuilder.getManyAndCount();

    const paginationResult = PaginationUtil.paginate(
      subcategories,
      totalCount,
      queryDto
    );

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Subcategorías obtenidas exitosamente',
        en: 'Subcategories retrieved successfully',
      },
      data: paginationResult,
    };
  }

  async findOne(id: string, branchId: string, companyId: string | null) {
    const whereCondition: any = { id, branchId };
    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const subcategory = await this.subcategoryRepository.findOne({
      where: whereCondition,
      relations: ['category'],
    });

    if (!subcategory) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Subcategoría no encontrada',
          en: 'Subcategory not found',
        },
      });
    }

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Subcategoría obtenida exitosamente',
        en: 'Subcategory retrieved successfully',
      },
      data: subcategory,
    };
  }

  async update(
    id: string,
    updateSubcategoryDto: UpdateSubcategoryDto,
    branchId: string,
    companyId: string | null
  ) {
    const whereCondition: any = { id, branchId };
    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const subcategory = await this.subcategoryRepository.findOne({
      where: whereCondition,
    });

    if (!subcategory) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Subcategoría no encontrada',
          en: 'Subcategory not found',
        },
      });
    }

    if (updateSubcategoryDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: updateSubcategoryDto.categoryId,
          branchId,
        },
      });

      if (!category) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: {
            es: 'La categoría no existe o no pertenece a esta sucursal',
            en: 'Category does not exist or does not belong to this branch',
          },
        });
      }
    }

    const categoryIdToCheck = updateSubcategoryDto.categoryId || subcategory.categoryId;
    const nextName = updateSubcategoryDto.name || subcategory.name;
    const normalizedNextName = this.normalizeName(nextName);
    const normalizedCurrentName = this.normalizeName(subcategory.name);
    const categoryChanged = categoryIdToCheck !== subcategory.categoryId;
    const nameChanged = normalizedNextName !== normalizedCurrentName;

    if (nameChanged || categoryChanged) {
      const duplicateWhereCondition: any = {
        categoryId: categoryIdToCheck,
        branchId,
      };

      if (companyId) {
        duplicateWhereCondition.companyId = companyId;
      }

      const existingSubcategories = await this.subcategoryRepository.find({
        where: duplicateWhereCondition,
        select: ['id', 'name'],
      });

      const existingSubcategory = existingSubcategories.find(
        (item) =>
          item.id !== subcategory.id &&
          this.normalizeName(item.name) === normalizedNextName
      );

      if (existingSubcategory) {
        throw new ConflictException({
          statusCode: 409,
          success: false,
          message: {
            es: 'Ya existe una subcategoría con este nombre en esta categoría',
            en: 'A subcategory with this name already exists in this category',
          },
        });
      }
    }

    // Proteger companyId y branchId de modificaciones
    const {
      companyId: _,
      branchId: __,
      ...safeUpdateData
    } = updateSubcategoryDto as any;

    if (safeUpdateData.name) {
      safeUpdateData.name = this.sanitizeName(safeUpdateData.name);
    }

    Object.assign(subcategory, safeUpdateData);
    const updatedSubcategory = await this.subcategoryRepository.save(
      subcategory
    );

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Subcategoría actualizada exitosamente',
        en: 'Subcategory updated successfully',
      },
      data: updatedSubcategory,
    };
  }

  async remove(id: string, branchId: string, companyId: string | null) {
    const whereCondition: any = { id, branchId };
    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const subcategory = await this.subcategoryRepository.findOne({
      where: whereCondition,
    });

    if (!subcategory) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Subcategoría no encontrada',
          en: 'Subcategory not found',
        },
      });
    }

    // Verificar si existen productos que referencian esta subcategoría
    const productsCount = await this.productRepository.count({
      where: { subcategoryId: id, branchId },
    });

    if (productsCount > 0) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: `No se puede eliminar la subcategoría ${
            subcategory.name
          } porque tiene ${productsCount} producto${
            productsCount > 1 ? 's' : ''
          } asociado${
            productsCount > 1 ? 's' : ''
          }. Primero elimine o reasigne los productos.`,
          en: `Cannot delete subcategory ${
            subcategory.name
          } because it has ${productsCount} associated product${
            productsCount > 1 ? 's' : ''
          }. Please delete or reassign the products first.`,
        },
      });
    }

    await this.subcategoryRepository.remove(subcategory);

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Subcategoría eliminada exitosamente',
        en: 'Subcategory deleted successfully',
      },
    };
  }
}
