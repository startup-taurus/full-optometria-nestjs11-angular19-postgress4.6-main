import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Subcategory } from '../subcategories/entities/subcategory.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { File } from '../files/entities/file.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { Company } from '../companies/entities/company.entity';
import { Branch } from '../branches/entities/branch.entity';
import { User } from '../users/entities/user.entity';
import { InventoryTransfer } from './entities/inventory-transfer.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { QueryProductDto } from './dtos/query-product.dto';
import { PublicQueryProductDto } from './dtos/public-query-product.dto';
import { TransferProductStockDto } from './dtos/transfer-product-stock.dto';
import { QueryProductTransferHistoryDto } from './dtos/query-product-transfer-history.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { CompanyFilterUtil } from '../../common/utils/company-filter.util';
import {
  ALLOWED_COMPANIES,
  getAllowedCompanyNames,
  isCompanyAllowed,
} from '../../common/constants/allowed-companies.constant';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const MAX_PRODUCT_IMAGES = 5;

@Injectable()
export class ProductsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(LaboratoryOrder)
    private laboratoryOrderRepository: Repository<LaboratoryOrder>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(InventoryTransfer)
    private inventoryTransferRepository: Repository<InventoryTransfer>
  ) {}

  async create(
    createProductDto: CreateProductDto,
    branchId: string,
    companyId: string | null,
    userId?: string
  ) {
    const whereCondition: any = {
      code: createProductDto.code,
      branchId,
    };
    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const existingProduct = await this.productRepository.findOne({
      where: whereCondition,
    });

    if (existingProduct) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: 'Ya existe un producto con este código en esta sucursal',
          en: 'A product with this code already exists in this branch',
        },
      });
    }

    await this.validateRelatedEntities(createProductDto, branchId);

    const product = this.productRepository.create({
      ...createProductDto,
      branchId,
      companyId,
      createdByUserId: userId,
    });

    const savedProduct = await this.productRepository.save(product);

    return {
      statusCode: 201,
      success: true,
      message: {
        es: 'Producto creado exitosamente',
        en: 'Product created successfully',
      },
      data: savedProduct,
    };
  }

  async findAll(
    queryDto: QueryProductDto,
    branchId: string,
    companyId: string | null
  ) {
    const { skip, take } = PaginationUtil.getSkipAndTake(queryDto);
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subcategory', 'subcategory')
      .leftJoinAndSelect('product.defaultSupplier', 'supplier')
      .leftJoinAndSelect('product.createdByUser', 'createdByUser');

    queryBuilder.where('product.branchId = :branchId', { branchId });

    // Aplicar filtro por companyId usando la utilidad
    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'product', companyId);

    if (queryDto.code) {
      queryBuilder.andWhere('product.code ILIKE :code', {
        code: `%${queryDto.code}%`,
      });
    }

    if (queryDto.name) {
      queryBuilder.andWhere('product.name ILIKE :name', {
        name: `%${queryDto.name}%`,
      });
    }

    if (queryDto.brand) {
      queryBuilder.andWhere('product.brand ILIKE :brand', {
        brand: `%${queryDto.brand}%`,
      });
    }

    if (queryDto.unitPrice !== undefined) {
      queryBuilder.andWhere('product.unitPrice = :unitPrice', {
        unitPrice: queryDto.unitPrice,
      });
    }

    if (queryDto.quantity !== undefined) {
      queryBuilder.andWhere('product.quantity = :quantity', {
        quantity: queryDto.quantity,
      });
    }

    if (queryDto.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', {
        categoryId: queryDto.categoryId,
      });
    }

    if (queryDto.subcategoryId) {
      queryBuilder.andWhere('product.subcategoryId = :subcategoryId', {
        subcategoryId: queryDto.subcategoryId,
      });
    }

    if (queryDto.supplierId) {
      queryBuilder.andWhere('product.defaultSupplierId = :supplierId', {
        supplierId: queryDto.supplierId,
      });
    }

    if (queryDto.isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', {
        isActive: queryDto.isActive,
      });
    }

    queryBuilder.orderBy('product.createdAt', 'DESC').skip(skip).take(take);

    const [products, totalCount] = await queryBuilder.getManyAndCount();

    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const images = await this.fileRepository.find({
          where: {
            entityType: 'product',
            entityId: product.id,
            fileCategory: 'product_image',
            isActive: true,
          },
          order: {
            isCover: 'DESC',
            createdAt: 'ASC',
          },
        });

        return {
          ...product,
          images: images.map((img) => ({
            id: img.id,
            path: img.path,
            isCover: img.isCover,
          })),
        };
      })
    );

    const paginationResult = PaginationUtil.paginate(
      productsWithImages,
      totalCount,
      queryDto
    );

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Productos obtenidos exitosamente',
        en: 'Products retrieved successfully',
      },
      data: paginationResult,
    };
  }

  async findOne(id: string, branchId: string, companyId: string | null) {
    const whereCondition: any = { id, branchId };
    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const product = await this.productRepository.findOne({
      where: whereCondition,
      relations: [
        'category',
        'subcategory',
        'defaultSupplier',
        'createdByUser',
      ],
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Producto no encontrado',
          en: 'Product not found',
        },
      });
    }

    const images = await this.fileRepository.find({
      where: {
        entityType: 'product',
        entityId: product.id,
        fileCategory: 'product_image',
        isActive: true,
      },
      order: {
        isCover: 'DESC',
        createdAt: 'ASC',
      },
    });

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Producto obtenido exitosamente',
        en: 'Product retrieved successfully',
      },
      data: {
        ...product,
        images: images.map((img) => ({
          id: img.id,
          path: img.path,
          isCover: img.isCover,
        })),
      },
    };
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    branchId: string,
    companyId: string | null
  ) {
    const whereCondition: any = { id, branchId };
    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const product = await this.productRepository.findOne({
      where: whereCondition,
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Producto no encontrado',
          en: 'Product not found',
        },
      });
    }

    if (updateProductDto.code && updateProductDto.code !== product.code) {
      const existingProduct = await this.productRepository.findOne({
        where: {
          code: updateProductDto.code,
          branchId,
        },
      });

      if (existingProduct) {
        throw new ConflictException({
          statusCode: 409,
          success: false,
          message: {
            es: 'Ya existe un producto con este código en esta sucursal',
            en: 'A product with this code already exists in this branch',
          },
        });
      }
    }

    await this.validateRelatedEntities(updateProductDto, branchId);

    const {
      companyId: _,
      branchId: __,
      ...safeUpdateData
    } = updateProductDto as any;
    Object.assign(product, safeUpdateData);
    const updatedProduct = await this.productRepository.save(product);

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Producto actualizado exitosamente',
        en: 'Product updated successfully',
      },
      data: updatedProduct,
    };
  }

  async remove(id: string, branchId: string, companyId: string | null) {
    const whereCondition: any = { id, branchId };
    if (companyId) {
      whereCondition.companyId = companyId;
    }

    const product = await this.productRepository.findOne({
      where: whereCondition,
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Producto no encontrado',
          en: 'Product not found',
        },
      });
    }

    const ordersCount = await this.laboratoryOrderRepository
      .createQueryBuilder('order')
      .where('order.branchId = :branchId', { branchId })
      .andWhere(
        '(order.productId = :productId OR :productId = ANY(order.productIds))',
        { productId: id }
      )
      .getCount();

    if (ordersCount > 0) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: `No se puede eliminar el producto ${
            product.name
          } porque está en ${ordersCount} orden${
            ordersCount > 1 ? 'es' : ''
          } de laboratorio. No se pueden eliminar productos con órdenes asociadas.`,
          en: `Cannot delete product ${
            product.name
          } because it is in ${ordersCount} laboratory order${
            ordersCount > 1 ? 's' : ''
          }. Cannot delete products with associated orders.`,
        },
      });
    }

    await this.productRepository.remove(product);

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Producto eliminado exitosamente',
        en: 'Product deleted successfully',
      },
    };
  }

  private async validateRelatedEntities(
    dto: CreateProductDto | UpdateProductDto,
    branchId: string
  ) {
    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId, branchId },
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

    if (dto.subcategoryId) {
      const subcategory = await this.subcategoryRepository.findOne({
        where: { id: dto.subcategoryId, branchId },
      });

      if (!subcategory) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: {
            es: 'La subcategoría no existe o no pertenece a esta sucursal',
            en: 'Subcategory does not exist or does not belong to this branch',
          },
        });
      }

      if (dto.categoryId && subcategory.categoryId !== dto.categoryId) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: {
            es: 'La subcategoría no pertenece a la categoría seleccionada',
            en: 'Subcategory does not belong to the selected category',
          },
        });
      }
    }

    if (dto.defaultSupplierId) {
      const supplier = await this.supplierRepository.findOne({
        where: { id: dto.defaultSupplierId, branchId },
      });

      if (!supplier) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: {
            es: 'El proveedor no existe o no pertenece a esta sucursal',
            en: 'Supplier does not exist or does not belong to this branch',
          },
        });
      }
    }
  }

  async findAllPublic(queryDto: PublicQueryProductDto) {
    const { page = 1, limit = 12, companyName, companySlug } = queryDto;
    const skip = (page - 1) * limit;

    let companyId: string | null = null;
    if (companySlug) {
      const company = await this.companyRepository.findOne({
        where: { slug: companySlug, isActive: true },
      });
      if (company) {
        companyId = company.id;
      }
    } else if (companyName) {
      const company = await this.companyRepository.findOne({
        where: { name: companyName, isActive: true },
      });
      if (company) {
        companyId = company.id;
      }
    }

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subcategory', 'subcategory')
      .leftJoinAndSelect('product.branch', 'branch')
      .leftJoinAndSelect('product.createdByUser', 'user')
      .where('product.isActive = :isActive', { isActive: true });

    if (companyId) {
      queryBuilder.andWhere('product.companyId = :companyId', { companyId });
    }

    if (queryDto.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.brand ILIKE :search)',
        { search: `%${queryDto.search}%` }
      );
    }

    if (queryDto.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', {
        categoryId: queryDto.categoryId,
      });
    }

    if (queryDto.subcategoryId) {
      queryBuilder.andWhere('product.subcategoryId = :subcategoryId', {
        subcategoryId: queryDto.subcategoryId,
      });
    }

    if (queryDto.minPrice !== undefined) {
      queryBuilder.andWhere('product.unitPrice >= :minPrice', {
        minPrice: queryDto.minPrice,
      });
    }

    if (queryDto.maxPrice !== undefined) {
      queryBuilder.andWhere('product.unitPrice <= :maxPrice', {
        maxPrice: queryDto.maxPrice,
      });
    }

    switch (queryDto.sortBy) {
      case 'views':
        queryBuilder.orderBy('product.views', 'DESC');
        break;
      case 'price-asc':
        queryBuilder.orderBy('product.unitPrice', 'ASC');
        break;
      case 'price-desc':
        queryBuilder.orderBy('product.unitPrice', 'DESC');
        break;
      case 'newest':
        queryBuilder.orderBy('product.createdAt', 'DESC');
        break;
      default:
        queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    queryBuilder.skip(skip).take(limit);

    const [products, totalCount] = await queryBuilder.getManyAndCount();

    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const images = await this.fileRepository.find({
          where: {
            entityType: 'product',
            entityId: product.id,
            isActive: true,
          },
          order: {
            isCover: 'DESC',
            createdAt: 'ASC',
          },
        });

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          brand: product.brand,
          unitPrice: product.unitPrice,
          quantity: product.quantity,
          views: product.views,
          createdAt: product.createdAt,
          category: product.category
            ? { id: product.category.id, name: product.category.name }
            : null,
          subcategory: product.subcategory
            ? { id: product.subcategory.id, name: product.subcategory.name }
            : null,
          branchName: product.branch?.name || 'Sin sucursal',
          branch: product.branch
            ? {
                id: product.branch.id,
                name: product.branch.name,
                address: product.branch.address,
              }
            : null,
          createdByUser: product.createdByUser
            ? {
                firstName: product.createdByUser.firstName,
                lastName: product.createdByUser.lastName,
                mobilePhone: product.createdByUser.mobilePhone,
              }
            : null,
          images: images.map((img) => ({
            id: img.id,
            path: img.path,
            isCover: img.isCover,
          })),
        };
      })
    );

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Productos obtenidos exitosamente',
        en: 'Products retrieved successfully',
      },
      data: {
        items: productsWithImages,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async findOnePublic(id: string) {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
      relations: ['category', 'subcategory', 'branch', 'createdByUser'],
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Producto no encontrado',
          en: 'Product not found',
        },
      });
    }

    const updatedViews = product.views + 1;
    await this.productRepository.update(product.id, {
      views: updatedViews,
    });

    const images = await this.fileRepository.find({
      where: {
        entityType: 'product',
        entityId: product.id,
        isActive: true,
      },
      order: {
        isCover: 'DESC',
        createdAt: 'ASC',
      },
    });

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Producto obtenido exitosamente',
        en: 'Product retrieved successfully',
      },
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        brand: product.brand,
        unitPrice: product.unitPrice,
        quantity: product.quantity,
        views: updatedViews,
        createdAt: product.createdAt,
        category: product.category
          ? { id: product.category.id, name: product.category.name }
          : null,
        subcategory: product.subcategory
          ? { id: product.subcategory.id, name: product.subcategory.name }
          : null,
        branchName: product.branch?.name || 'Sin sucursal',
        branch: product.branch
          ? {
              id: product.branch.id,
              name: product.branch.name,
              address: product.branch.address,
            }
          : null,
        createdByUser: product.createdByUser
          ? {
              firstName: product.createdByUser.firstName,
              lastName: product.createdByUser.lastName,
              mobilePhone: product.createdByUser.mobilePhone,
            }
          : null,
        images: images.map((img) => ({
          id: img.id,
          path: img.path,
          isCover: img.isCover,
        })),
      },
    };
  }

  async getPublicFilters(companySlug?: string, companyName?: string) {
    let companyId: string | null = null;
    if (companySlug) {
      const company = await this.companyRepository.findOne({
        where: { slug: companySlug, isActive: true },
      });
      if (company) {
        companyId = company.id;
      }
    } else if (companyName) {
      const company = await this.companyRepository.findOne({
        where: { name: companyName, isActive: true },
      });
      if (company) {
        companyId = company.id;
      }
    }

    const categoryQueryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.isActive = :isActive', { isActive: true });

    if (companyId) {
      categoryQueryBuilder.andWhere('category.companyId = :companyId', {
        companyId,
      });
    }

    const categories = await categoryQueryBuilder
      .select(['category.id', 'category.name'])
      .orderBy('category.name', 'ASC')
      .getMany();

    const subcategoryQueryBuilder = this.subcategoryRepository
      .createQueryBuilder('subcategory')
      .where('subcategory.isActive = :isActive', { isActive: true });

    if (companyId) {
      subcategoryQueryBuilder.andWhere('subcategory.companyId = :companyId', {
        companyId,
      });
    }

    const subcategories = await subcategoryQueryBuilder
      .select(['subcategory.id', 'subcategory.name', 'subcategory.categoryId'])
      .orderBy('subcategory.name', 'ASC')
      .getMany();

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Filtros obtenidos exitosamente',
        en: 'Filters retrieved successfully',
      },
      data: {
        categories,
        subcategories,
      },
    };
  }

  async validateCompany(companySlug: string) {
    if (!isCompanyAllowed(companySlug)) {
      return {
        statusCode: 200,
        success: true,
        message: {
          es: 'Validación completada',
          en: 'Validation completed',
        },
        data: {
          isValid: false,
          company: null,
        },
      };
    }

    const company = await this.companyRepository.findOne({
      where: { slug: companySlug, isActive: true },
    });

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Validación completada',
        en: 'Validation completed',
      },
      data: {
        isValid: !!company,
        company: company
          ? { id: company.id, name: company.name, slug: company.slug }
          : null,
      },
    };
  }

  async getAllowedCompanies() {
    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Empresas permitidas obtenidas',
        en: 'Allowed companies retrieved',
      },
      data: getAllowedCompanyNames(),
    };
  }

  async transferStock(
    productId: string,
    transferDto: TransferProductStockDto,
    sourceBranchId: string,
    companyId: string | null,
    userId?: string
  ) {
    const quantity = Number(transferDto.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'La cantidad a transferir debe ser mayor a 0',
          en: 'Transfer quantity must be greater than 0',
        },
      });
    }

    if (transferDto.destinationBranchId === sourceBranchId) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'La sucursal destino debe ser diferente a la sucursal origen',
          en: 'Destination branch must be different from source branch',
        },
      });
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const sourceWhere: any = { id: productId, branchId: sourceBranchId };
      if (companyId) {
        sourceWhere.companyId = companyId;
      }

      const sourceProduct = await manager.findOne(Product, {
        where: sourceWhere,
        relations: ['category', 'subcategory'],
      });

      if (!sourceProduct) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: {
            es: 'Producto origen no encontrado',
            en: 'Source product not found',
          },
        });
      }

      if (!sourceProduct.isActive) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: {
            es: 'No se puede transferir un producto inactivo',
            en: 'Cannot transfer an inactive product',
          },
        });
      }

      if (sourceProduct.quantity < quantity) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: {
            es: 'La cantidad a transferir excede el stock disponible',
            en: 'Transfer quantity exceeds available stock',
          },
        });
      }

      const destinationWhere: any = {
        id: transferDto.destinationBranchId,
        isActive: true,
      };
      if (sourceProduct.companyId) {
        destinationWhere.companyId = sourceProduct.companyId;
      }

      const destinationBranch = await manager.findOne(Branch, {
        where: destinationWhere,
      });

      if (!destinationBranch) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: {
            es: 'La sucursal destino no existe o no está activa',
            en: 'Destination branch does not exist or is not active',
          },
        });
      }

      const destinationProductWhere: any = {
        branchId: transferDto.destinationBranchId,
        code: sourceProduct.code,
      };
      if (sourceProduct.companyId) {
        destinationProductWhere.companyId = sourceProduct.companyId;
      }

      let destinationProduct = await manager.findOne(Product, {
        where: destinationProductWhere,
      });
      let destinationCreated = false;

      if (!destinationProduct) {
        const destinationCategory = await this.resolveOrCreateDestinationCategory(
          manager,
          sourceProduct,
          transferDto.destinationBranchId
        );

        const destinationSubcategory =
          await this.resolveOrCreateDestinationSubcategory(
            manager,
            sourceProduct,
            destinationCategory,
            transferDto.destinationBranchId
          );

        destinationProduct = manager.create(Product, {
          companyId: sourceProduct.companyId,
          branchId: transferDto.destinationBranchId,
          code: sourceProduct.code,
          name: sourceProduct.name,
          description: sourceProduct.description,
          categoryId: destinationCategory.id,
          subcategoryId: destinationSubcategory.id,
          brand: sourceProduct.brand,
          unitPrice: sourceProduct.unitPrice,
          quantity: 0,
          defaultSupplierId: null,
          createdByUserId: userId,
          isActive: true,
        });
        destinationCreated = true;
      }

      sourceProduct.quantity -= quantity;
      destinationProduct.quantity += quantity;

      const savedDestinationProduct = await manager.save(Product, destinationProduct);
      const savedSourceProduct = await manager.save(Product, sourceProduct);

      const transfer = manager.create(InventoryTransfer, {
        companyId: sourceProduct.companyId,
        sourceBranchId,
        targetBranchId: transferDto.destinationBranchId,
        sourceProductId: savedSourceProduct.id,
        targetProductId: savedDestinationProduct.id,
        sourceCode: savedSourceProduct.code,
        quantity,
        note: transferDto.note || null,
        createdByUserId: userId,
      });

      const savedTransfer = await manager.save(InventoryTransfer, transfer);

      const sourceMovement = manager.create(StockMovement, {
        companyId: sourceProduct.companyId,
        branchId: sourceBranchId,
        productId: savedSourceProduct.id,
        movementType: 'SALIDA_TRANSFERENCIA',
        quantity,
        balanceAfter: savedSourceProduct.quantity,
        referenceType: 'TRANSFERENCIA',
        referenceId: savedTransfer.id,
        note: transferDto.note || null,
        createdByUserId: userId,
      });

      const destinationMovement = manager.create(StockMovement, {
        companyId: sourceProduct.companyId,
        branchId: transferDto.destinationBranchId,
        productId: savedDestinationProduct.id,
        movementType: 'INGRESO_TRANSFERENCIA',
        quantity,
        balanceAfter: savedDestinationProduct.quantity,
        referenceType: 'TRANSFERENCIA',
        referenceId: savedTransfer.id,
        note: transferDto.note || null,
        createdByUserId: userId,
      });

      await manager.save(StockMovement, sourceMovement);
      await manager.save(StockMovement, destinationMovement);

      return {
        transfer: savedTransfer,
        sourceProduct: savedSourceProduct,
        destinationProduct: savedDestinationProduct,
        destinationCreated,
      };
    });

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Transferencia realizada exitosamente',
        en: 'Stock transfer completed successfully',
      },
      data: result,
    };
  }

  async getTransferHistory(
    queryDto: QueryProductTransferHistoryDto,
    branchId: string,
    companyId: string | null
  ) {

    const queryBuilder = this.inventoryTransferRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.sourceProduct', 'sourceProduct')
      .leftJoinAndSelect('transfer.targetProduct', 'targetProduct')
      .leftJoinAndSelect('transfer.createdByUser', 'createdByUser');

    if (companyId) {
      queryBuilder.where('transfer.companyId = :companyId', { companyId });
    } else {
      queryBuilder.where('1 = 1');
    }

    const direction = queryDto.direction || 'all';
    const hasBranchId = !!branchId;

    if (hasBranchId) {
      if (direction === 'sent') {
        queryBuilder.andWhere('transfer.sourceBranchId = :branchId', { branchId });
      } else if (direction === 'received') {
        queryBuilder.andWhere('transfer.targetBranchId = :branchId', { branchId });
      } else {
        queryBuilder.andWhere(
          '(transfer.sourceBranchId = :branchId OR transfer.targetBranchId = :branchId)',
          { branchId }
        );
      }
    }

    if (queryDto.productId) {
      queryBuilder.andWhere(
        '(transfer.sourceProductId = :productId OR transfer.targetProductId = :productId)',
        { productId: queryDto.productId }
      );
    }

    const history = await queryBuilder
      .orderBy('transfer.createdAt', 'DESC')
      .getMany();

    if (!history.length) {
      return history;
    }

    const transferIds = history.map((transfer) => transfer.id);
    const userIds = [
      ...new Set(
        history
          .map((transfer) => transfer.createdByUserId)
          .filter((id): id is string => !!id)
      ),
    ];

    const movementRepository = this.dataSource.getRepository(StockMovement);
    const relatedMovements = await movementRepository.find({
      where: {
        referenceType: 'TRANSFERENCIA',
        referenceId: In(transferIds),
      },
    });

    const usersById = new Map<string, User>();
    if (userIds.length) {
      const userRepository = this.dataSource.getRepository(User);
      const users = await userRepository.find({
        where: { id: In(userIds) },
      });

      users.forEach((user) => {
        usersById.set(user.id, user);
      });
    }

    const movementsByTransferId = new Map<string, StockMovement[]>();
    relatedMovements.forEach((movement) => {
      if (!movement.referenceId) {
        return;
      }

      const current = movementsByTransferId.get(movement.referenceId) || [];
      current.push(movement);
      movementsByTransferId.set(movement.referenceId, current);
    });

    return history.map((transfer) => {
      const transferMovements = movementsByTransferId.get(transfer.id) || [];
      const sourceMovement = transferMovements.find(
        (movement) => movement.movementType === 'SALIDA_TRANSFERENCIA'
      );
      const targetMovement = transferMovements.find(
        (movement) => movement.movementType === 'INGRESO_TRANSFERENCIA'
      );
      const transferUser =
        transfer.createdByUser ||
        (transfer.createdByUserId
          ? usersById.get(transfer.createdByUserId)
          : undefined);

      return {
        ...transfer,
        createdByUser: transferUser || null,
        sourceBalanceAfterTransfer: sourceMovement?.balanceAfter ?? null,
        targetBalanceAfterTransfer: targetMovement?.balanceAfter ?? null,
      };
    });
  }

  private async resolveOrCreateDestinationCategory(
    manager: any,
    sourceProduct: Product,
    destinationBranchId: string
  ): Promise<Category> {
    const sourceCategory = await manager.findOne(Category, {
      where: { id: sourceProduct.categoryId },
    });

    if (!sourceCategory) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'La categoría del producto origen no existe',
          en: 'Source product category does not exist',
        },
      });
    }

    const destinationCategoryWhere: any = {
      branchId: destinationBranchId,
      name: sourceCategory.name,
    };
    if (sourceCategory.companyId) {
      destinationCategoryWhere.companyId = sourceCategory.companyId;
    }

    const destinationCategory = await manager.findOne(Category, {
      where: destinationCategoryWhere,
    });

    if (destinationCategory) {
      return destinationCategory;
    }

    const newCategory = manager.create(Category, {
      companyId: sourceCategory.companyId,
      branchId: destinationBranchId,
      name: sourceCategory.name,
      description: sourceCategory.description,
      isActive: sourceCategory.isActive,
    });

    return manager.save(Category, newCategory);
  }

  private async resolveOrCreateDestinationSubcategory(
    manager: any,
    sourceProduct: Product,
    destinationCategory: Category,
    destinationBranchId: string
  ): Promise<Subcategory> {
    const sourceSubcategory = await manager.findOne(Subcategory, {
      where: { id: sourceProduct.subcategoryId },
    });

    if (!sourceSubcategory) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'La subcategoría del producto origen no existe',
          en: 'Source product subcategory does not exist',
        },
      });
    }

    const destinationSubcategoryWhere: any = {
      branchId: destinationBranchId,
      categoryId: destinationCategory.id,
      name: sourceSubcategory.name,
    };
    if (sourceSubcategory.companyId) {
      destinationSubcategoryWhere.companyId = sourceSubcategory.companyId;
    }

    const destinationSubcategory = await manager.findOne(Subcategory, {
      where: destinationSubcategoryWhere,
    });

    if (destinationSubcategory) {
      return destinationSubcategory;
    }

    const newSubcategory = manager.create(Subcategory, {
      companyId: sourceSubcategory.companyId,
      branchId: destinationBranchId,
      categoryId: destinationCategory.id,
      name: sourceSubcategory.name,
      description: sourceSubcategory.description,
      isActive: sourceSubcategory.isActive,
    });

    return manager.save(Subcategory, newSubcategory);
  }

  async uploadProductImage(
    productId: string,
    file: Express.Multer.File,
    branchId: string,
    isCover: boolean = true
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId, branchId },
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Producto no encontrado',
          en: 'Product not found',
        },
      });
    }

    if (!file) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'El archivo de imagen es requerido',
          en: 'Image file is required',
        },
      });
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'Solo se permiten archivos de imagen: PNG, JPG, JPEG, WEBP',
          en: 'Only image files are allowed: PNG, JPG, JPEG, WEBP',
        },
      });
    }

    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'El tamaño del archivo excede el límite de 8MB',
          en: 'File size exceeds 8MB limit',
        },
      });
    }

    const existingImagesCount = await this.fileRepository.count({
      where: {
        entityType: 'product',
        entityId: productId,
        fileCategory: 'product_image',
        isActive: true,
      },
    });

    if (existingImagesCount >= MAX_PRODUCT_IMAGES) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: `Solo se permiten ${MAX_PRODUCT_IMAGES} imágenes por producto`,
          en: `Only ${MAX_PRODUCT_IMAGES} images per product are allowed`,
        },
      });
    }

    try {
      const uploadDir = path.join(
        process.cwd(),
        'uploads',
        'product',
        'product_image'
      );

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadDir, uniqueFilename);
      const relativePath = path.relative(process.cwd(), filePath);

      await this.optimizeAndSaveImage(file.buffer, filePath, file.mimetype);

      const stats = fs.statSync(filePath);
      const finalSize = stats.size;

      if (isCover) {
        const oldCoverFiles = await this.fileRepository.find({
          where: {
            entityType: 'product',
            entityId: productId,
            fileCategory: 'product_image',
            isCover: true,
            isActive: true,
          },
        });

        for (const oldFile of oldCoverFiles) {
          try {
            const oldFilePath = path.join(process.cwd(), oldFile.path);
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          } catch (error) {
 
          }

          await this.fileRepository.remove(oldFile);
        }
      }

      const fileEntity = this.fileRepository.create({
        filename: uniqueFilename,
        originalName: file.originalname,
        path: relativePath.replace(/\\/g, '/'),
        size: finalSize,
        mimeType: file.mimetype,
        entityType: 'product',
        entityId: productId,
        fileCategory: 'product_image',
        isCover: isCover,
        isActive: true,
      });

      const savedFile = await this.fileRepository.save(fileEntity);

      return {
        statusCode: 201,
        success: true,
        message: {
          es: 'Imagen del producto subida exitosamente',
          en: 'Product image uploaded successfully',
        },
        data: {
          id: savedFile.id,
          filename: savedFile.filename,
          originalName: savedFile.originalName,
          path: savedFile.path,
          size: savedFile.size,
          mimeType: savedFile.mimeType,
          isCover: savedFile.isCover,
          url: savedFile.path.startsWith('/')
            ? savedFile.path
            : `/${savedFile.path}`,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'Error al subir la imagen del producto',
          en: 'Error uploading product image',
        },
        details: error.message,
      });
    }
  }

  private async optimizeAndSaveImage(
    buffer: Buffer,
    filePath: string,
    mimeType: string
  ): Promise<void> {
    try {
      let sharpInstance = sharp(buffer);

      const metadata = await sharpInstance.metadata();

      if (metadata.width > 1920) {
        sharpInstance = sharpInstance.resize(1920, null, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      if (mimeType === 'image/png') {
        await sharpInstance
          .png({ quality: 90, compressionLevel: 9 })
          .toFile(filePath);
      } else if (mimeType === 'image/webp') {
        await sharpInstance.webp({ quality: 85 }).toFile(filePath);
      } else {
        await sharpInstance
          .jpeg({ quality: 85, progressive: true })
          .toFile(filePath);
      }
    } catch (error) {

      fs.writeFileSync(filePath, buffer);
    }
  }

  async getProductImages(productId: string, branchId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId, branchId },
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Producto no encontrado',
          en: 'Product not found',
        },
      });
    }

    const images = await this.fileRepository.find({
      where: {
        entityType: 'product',
        entityId: productId,
        fileCategory: 'product_image',
        isActive: true,
      },
      order: {
        isCover: 'DESC',
        createdAt: 'ASC',
      },
    });

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Imágenes del producto obtenidas exitosamente',
        en: 'Product images retrieved successfully',
      },
      data: images.map((img) => ({
        id: img.id,
        filename: img.filename,
        path: img.path,
        size: img.size,
        mimeType: img.mimeType,
        isCover: img.isCover,
        url: img.path.startsWith('/') ? img.path : `/${img.path}`,
      })),
    };
  }

  async deleteProductImage(
    productId: string,
    imageId: string,
    branchId: string
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId, branchId },
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Producto no encontrado',
          en: 'Product not found',
        },
      });
    }

    const image = await this.fileRepository.findOne({
      where: {
        id: imageId,
        entityType: 'product',
        entityId: productId,
        fileCategory: 'product_image',
        isActive: true,
      },
    });

    if (!image) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Imagen no encontrada o ya fue eliminada',
          en: 'Image not found or already deleted',
        },
      });
    }

    try {
      const filePath = path.join(process.cwd(), image.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await this.fileRepository.remove(image);

      return {
        statusCode: 200,
        success: true,
        message: {
          es: 'Imagen del producto eliminada exitosamente',
          en: 'Product image deleted successfully',
        },
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'Error al eliminar la imagen del producto',
          en: 'Error deleting product image',
        },
        details: error.message,
      });
    }
  }
}
