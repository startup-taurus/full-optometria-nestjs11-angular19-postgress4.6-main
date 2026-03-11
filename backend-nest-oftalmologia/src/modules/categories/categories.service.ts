import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Subcategory } from '../subcategories/entities/subcategory.entity';
import { Product } from '../products/entities/product.entity';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { QueryCategoryDto } from './dtos/query-category.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { CompanyFilterUtil } from '../../common/utils/company-filter.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private subcategoryRepository: Repository<Subcategory>,
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
    createCategoryDto: CreateCategoryDto,
    branchId: string,
    companyId: string | null
  ) {
    const normalizedName = this.normalizeName(createCategoryDto.name);
    const sanitizedName = this.sanitizeName(createCategoryDto.name);
    const whereCondition: any = { branchId };
    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const existingCategories = await this.categoryRepository.find({
      where: whereCondition,
      select: ['id', 'name'],
    });

    const existingCategory = existingCategories.find(
      (item) => this.normalizeName(item.name) === normalizedName
    );

    if (existingCategory) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: 'Ya existe una categoría con este nombre en esta sucursal',
          en: 'A category with this name already exists in this branch',
        },
      });
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      name: sanitizedName,
      branchId,
      companyId,
    });

    const savedCategory = await this.categoryRepository.save(category);

    return {
      statusCode: 201,
      success: true,
      message: {
        es: 'Categoría creada exitosamente',
        en: 'Category created successfully',
      },
      data: savedCategory,
    };
  }

  async findAll(
    queryDto: QueryCategoryDto,
    branchId: string,
    companyId: string | null
  ) {
    const { skip, take } = PaginationUtil.getSkipAndTake(queryDto);
    const queryBuilder = this.categoryRepository.createQueryBuilder('category');

    queryBuilder.where('category.branchId = :branchId', { branchId });

    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'category', companyId);

    if (queryDto.search) {
      queryBuilder.andWhere('category.name ILIKE :search', {
        search: `%${queryDto.search}%`,
      });
    }

    if (queryDto.isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', {
        isActive: queryDto.isActive,
      });
    }

    queryBuilder.orderBy('category.createdAt', 'DESC').skip(skip).take(take);

    const [categories, totalCount] = await queryBuilder.getManyAndCount();

    const paginationResult = PaginationUtil.paginate(
      categories,
      totalCount,
      queryDto
    );

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Categorías obtenidas exitosamente',
        en: 'Categories retrieved successfully',
      },
      data: paginationResult,
    };
  }

  async findOne(id: string, branchId: string, companyId: string | null) {
    const whereCondition: any = { id, branchId };
    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const category = await this.categoryRepository.findOne({
      where: whereCondition,
    });

    if (!category) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Categoría no encontrada',
          en: 'Category not found',
        },
      });
    }

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Categoría obtenida exitosamente',
        en: 'Category retrieved successfully',
      },
      data: category,
    };
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    branchId: string,
    companyId: string | null
  ) {
    const whereCondition: any = { id, branchId };
    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const category = await this.categoryRepository.findOne({
      where: whereCondition,
    });

    if (!category) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Categoría no encontrada',
          en: 'Category not found',
        },
      });
    }

    if (updateCategoryDto.name) {
      const normalizedNewName = this.normalizeName(updateCategoryDto.name);
      const normalizedCurrentName = this.normalizeName(category.name);

      if (normalizedNewName !== normalizedCurrentName) {
        const duplicateWhereCondition: any = { branchId };
        if (companyId) {
          duplicateWhereCondition.companyId = companyId;
        }

        const existingCategories = await this.categoryRepository.find({
          where: duplicateWhereCondition,
          select: ['id', 'name'],
        });

        const existingCategory = existingCategories.find(
          (item) =>
            item.id !== category.id &&
            this.normalizeName(item.name) === normalizedNewName
        );

        if (existingCategory) {
          throw new ConflictException({
            statusCode: 409,
            success: false,
            message: {
              es: 'Ya existe una categoría con este nombre en esta sucursal',
              en: 'A category with this name already exists in this branch',
            },
          });
        }
      }
    }

    const {
      companyId: _,
      branchId: __,
      ...safeUpdateData
    } = updateCategoryDto as any;

    if (safeUpdateData.name) {
      safeUpdateData.name = this.sanitizeName(safeUpdateData.name);
    }

    Object.assign(category, safeUpdateData);
    const updatedCategory = await this.categoryRepository.save(category);

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Categoría actualizada exitosamente',
        en: 'Category updated successfully',
      },
      data: updatedCategory,
    };
  }

  async remove(id: string, branchId: string, companyId: string | null) {
    const whereCondition: any = { id, branchId };
    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const category = await this.categoryRepository.findOne({
      where: whereCondition,
    });

    if (!category) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Categoría no encontrada',
          en: 'Category not found',
        },
      });
    }

    const subcategoriesCount = await this.subcategoryRepository.count({
      where: { categoryId: id, branchId },
    });

    if (subcategoriesCount > 0) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: `No se puede eliminar la categoría ${
            category.name
          } porque tiene ${subcategoriesCount} subcategoría${
            subcategoriesCount > 1 ? 's' : ''
          } asociada${
            subcategoriesCount > 1 ? 's' : ''
          }. Primero elimine las subcategorías.`,
          en: `Cannot delete category ${
            category.name
          } because it has ${subcategoriesCount} associated subcategor${
            subcategoriesCount > 1 ? 'ies' : 'y'
          }. Please delete the subcategories first.`,
        },
      });
    }

    const productsCount = await this.productRepository.count({
      where: { categoryId: id, branchId },
    });

    if (productsCount > 0) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: `No se puede eliminar la categoría ${
            category.name
          } porque tiene ${productsCount} producto${
            productsCount > 1 ? 's' : ''
          } asociado${
            productsCount > 1 ? 's' : ''
          }. Primero elimine o reasigne los productos.`,
          en: `Cannot delete category ${
            category.name
          } because it has ${productsCount} associated product${
            productsCount > 1 ? 's' : ''
          }. Please delete or reassign the products first.`,
        },
      });
    }

    await this.categoryRepository.remove(category);

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Categoría eliminada exitosamente',
        en: 'Category deleted successfully',
      },
    };
  }
}
