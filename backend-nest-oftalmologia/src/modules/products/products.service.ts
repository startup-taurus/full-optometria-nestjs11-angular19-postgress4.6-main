import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
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
import { QueryProductStockHistoryDto } from './dtos/query-product-stock-history.dto';
import {
  ProductDiscount,
  DiscountType,
} from './entities/product-discount.entity';
import {
  ProductAuditLog,
  ProductAuditEventType,
} from './entities/product-audit-log.entity';
import { CreateApplyDiscountDto } from './dtos/create-apply-discount.dto';
import { QueryProductHistoryDto } from './dtos/query-product-history.dto';
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
    private inventoryTransferRepository: Repository<InventoryTransfer>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(ProductDiscount)
    private productDiscountRepository: Repository<ProductDiscount>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(ProductAuditLog)
    private productAuditLogRepository: Repository<ProductAuditLog>,
  ) {}

  private async registerStockMovement(
    payload: {
      companyId: string | null;
      branchId: string;
      productId: string;
      movementType: string;
      quantity: number;
      balanceAfter: number;
      referenceType: string;
      referenceId: string;
      note?: string | null;
      createdByUserId?: string;
    },
    manager?: any,
  ) {
    const normalizedQuantity = Number.isFinite(Number(payload.quantity))
      ? Math.max(0, Number(payload.quantity))
      : 0;

    const normalizedBalanceAfter = Number.isFinite(Number(payload.balanceAfter))
      ? Number(payload.balanceAfter)
      : 0;

    const repository = manager
      ? manager.getRepository(StockMovement)
      : this.stockMovementRepository;

    const stockMovement = repository.create({
      companyId: payload.companyId,
      branchId: payload.branchId,
      productId: payload.productId,
      movementType: payload.movementType,
      quantity: normalizedQuantity,
      balanceAfter: normalizedBalanceAfter,
      referenceType: payload.referenceType,
      referenceId: payload.referenceId,
      note: payload.note ?? null,
      createdByUserId: payload.createdByUserId,
    });

    await repository.save(stockMovement);
  }

  private async registerProductEvent(payload: {
    companyId: string | null;
    branchId: string;
    productId: string;
    eventType: string;
    changedFields?: Record<string, any> | null;
    metadata?: Record<string, any> | null;
    createdByUserId?: string;
  }): Promise<void> {
    const auditLog = this.productAuditLogRepository.create({
      companyId: payload.companyId,
      branchId: payload.branchId,
      productId: payload.productId,
      eventType: payload.eventType,
      changedFields: payload.changedFields ?? null,
      metadata: payload.metadata ?? null,
      createdByUserId: payload.createdByUserId,
    });
    await this.productAuditLogRepository.save(auditLog);
  }

  private normalizeFilterKey(value?: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private groupCategoriesForPublicFilters(
    categories: Array<{ id: string; name: string }>,
  ) {
    const groupedMap = new Map<
      string,
      { id: string; name: string; ids: string[] }
    >();
    const categoryIdMap = new Map<string, string>();

    for (const category of categories) {
      const key = this.normalizeFilterKey(category.name);
      if (!key) continue;

      const existing = groupedMap.get(key);
      if (!existing) {
        groupedMap.set(key, {
          id: category.id,
          name: category.name.trim(),
          ids: [category.id],
        });
        categoryIdMap.set(category.id, category.id);
        continue;
      }

      if (!existing.ids.includes(category.id)) {
        existing.ids.push(category.id);
      }

      categoryIdMap.set(category.id, existing.id);
    }

    const groupedCategories = Array.from(groupedMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
    );

    return { groupedCategories, categoryIdMap };
  }

  private groupSubcategoriesForPublicFilters(
    subcategories: Array<{ id: string; name: string; categoryId: string }>,
    categoryIdMap: Map<string, string>,
  ) {
    const groupedMap = new Map<
      string,
      { id: string; name: string; categoryId: string; ids: string[] }
    >();

    for (const subcategory of subcategories) {
      const representativeCategoryId = categoryIdMap.get(
        subcategory.categoryId,
      );
      if (!representativeCategoryId) continue;

      const normalizedName = this.normalizeFilterKey(subcategory.name);
      if (!normalizedName) continue;

      const key = `${representativeCategoryId}::${normalizedName}`;
      const existing = groupedMap.get(key);

      if (!existing) {
        groupedMap.set(key, {
          id: subcategory.id,
          name: subcategory.name.trim(),
          categoryId: representativeCategoryId,
          ids: [subcategory.id],
        });
        continue;
      }

      if (!existing.ids.includes(subcategory.id)) {
        existing.ids.push(subcategory.id);
      }
    }

    return Array.from(groupedMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
    );
  }

  private groupBrandsForPublicFilters(brands: string[]) {
    const groupedMap = new Map<string, string>();

    for (const brand of brands) {
      const normalizedBrand = this.normalizeFilterKey(brand);
      if (!normalizedBrand) continue;

      if (!groupedMap.has(normalizedBrand)) {
        groupedMap.set(normalizedBrand, brand.trim());
      }
    }

    return Array.from(groupedMap.values()).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' }),
    );
  }

  async create(
    createProductDto: CreateProductDto,
    branchId: string,
    companyId: string | null,
    userId?: string,
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

    await this.registerStockMovement({
      companyId,
      branchId,
      productId: savedProduct.id,
      movementType: 'STOCK_INICIAL',
      quantity: Number(savedProduct.quantity) || 0,
      balanceAfter: Number(savedProduct.quantity) || 0,
      referenceType: 'PRODUCT_CREATION',
      referenceId: savedProduct.id,
      note: null,
      createdByUserId: userId,
    });

    await this.registerProductEvent({
      companyId,
      branchId,
      productId: savedProduct.id,
      eventType: ProductAuditEventType.CREATED,
      metadata: {
        name: savedProduct.name,
        code: savedProduct.code,
        brand: savedProduct.brand,
        unitPrice: Number(savedProduct.unitPrice),
        quantity: Number(savedProduct.quantity) || 0,
      },
      createdByUserId: userId,
    });

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
    companyId: string | null,
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

    // Batch load discounts for all products in a single query
    const discountMap = new Map<string, ProductDiscount>();
    if (products.length > 0) {
      const discounts = await this.productDiscountRepository.find({
        where: products.map((p) => ({ productId: p.id, branchId: p.branchId })),
      });
      discounts.forEach((d) =>
        discountMap.set(`${d.productId}:${d.branchId}`, d),
      );
    }

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

        const discount =
          discountMap.get(`${product.id}:${product.branchId}`) || null;
        const { finalPrice } = this.calculateFinalPrice(
          Number(product.unitPrice),
          discount,
        );
        const discountActive = !!discount && this.isDiscountActive(discount);

        return {
          ...product,
          images: images.map((img) => ({
            id: img.id,
            path: img.path,
            isCover: img.isCover,
          })),
          hasActiveDiscount: discountActive,
          ...(discountActive
            ? {
                discount: {
                  type: discount!.discountType,
                  value: Number(discount!.discountValue),
                  finalPrice: Number(finalPrice.toFixed(2)),
                  originalPrice: Number(product.unitPrice),
                  startDate: discount!.startDate,
                  endDate: discount!.endDate,
                  isActive: discount!.isActive,
                },
              }
            : {}),
        };
      }),
    );

    const paginationResult = PaginationUtil.paginate(
      productsWithImages,
      totalCount,
      queryDto,
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

    const discount = await this.findActiveDiscount(
      product.id,
      product.branchId,
    );
    const { finalPrice } = this.calculateFinalPrice(
      Number(product.unitPrice),
      discount,
    );
    const discountActive = !!discount && this.isDiscountActive(discount);

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
        hasActiveDiscount: discountActive,
        ...(discountActive
          ? {
              discount: {
                type: discount!.discountType,
                value: Number(discount!.discountValue),
                finalPrice: Number(finalPrice.toFixed(2)),
                originalPrice: Number(product.unitPrice),
                startDate: discount!.startDate,
                endDate: discount!.endDate,
                isActive: discount!.isActive,
              },
            }
          : {}),
      },
    };
  }

  async findOneByCode(code: string, branchId: string, companyId: string | null) {
    const normalizedCode = (code || '').trim();

    if (!normalizedCode) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'El código es requerido',
          en: 'Code is required',
        },
      });
    }

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subcategory', 'subcategory')
      .leftJoinAndSelect('product.defaultSupplier', 'supplier')
      .leftJoinAndSelect('product.createdByUser', 'createdByUser')
      .where('product.branchId = :branchId', { branchId })
      .andWhere('LOWER(TRIM(product.code)) = LOWER(TRIM(:code))', {
        code: normalizedCode,
      });

    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'product', companyId);

    const product = await queryBuilder.getOne();

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'No se encontró un producto con ese código en la sucursal activa',
          en: 'No product found with that code in the active branch',
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

    const discount = await this.findActiveDiscount(product.id, product.branchId);
    const { finalPrice } = this.calculateFinalPrice(
      Number(product.unitPrice),
      discount,
    );
    const discountActive = !!discount && this.isDiscountActive(discount);

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
        hasActiveDiscount: discountActive,
        ...(discountActive
          ? {
              discount: {
                type: discount!.discountType,
                value: Number(discount!.discountValue),
                finalPrice: Number(finalPrice.toFixed(2)),
                originalPrice: Number(product.unitPrice),
                startDate: discount!.startDate,
                endDate: discount!.endDate,
                isActive: discount!.isActive,
              },
            }
          : {}),
      },
    };
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    branchId: string,
    companyId: string | null,
    userId?: string,
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

    const TRACKED_FIELDS = [
      'name',
      'description',
      'brand',
      'code',
      'unitPrice',
      'quantity',
      'categoryId',
      'subcategoryId',
      'defaultSupplierId',
      'isActive',
    ] as const;

    const previousQuantity = Number(product.quantity);

    const {
      companyId: _,
      branchId: __,
      ...safeUpdateData
    } = updateProductDto as any;

    const changedFields: Record<string, { from: any; to: any }> = {};
    for (const field of TRACKED_FIELDS) {
      const newVal = (safeUpdateData as any)[field];
      if (newVal !== undefined) {
        const oldVal = (product as any)[field];
        if (String(oldVal) !== String(newVal)) {
          changedFields[field] = { from: oldVal, to: newVal };
        }
      }
    }

    Object.assign(product, safeUpdateData);

    const nextQuantity = Number(product.quantity);
    const updatedProduct = await this.productRepository.save(product);

    if (nextQuantity !== previousQuantity) {
      const quantityDelta = Math.abs(nextQuantity - previousQuantity);
      const movementType =
        nextQuantity > previousQuantity
          ? 'INGRESO_AJUSTE_MANUAL'
          : 'SALIDA_AJUSTE_MANUAL';

      await this.registerStockMovement({
        companyId,
        branchId,
        productId: updatedProduct.id,
        movementType,
        quantity: quantityDelta,
        balanceAfter: nextQuantity,
        referenceType: 'PRODUCT_UPDATE',
        referenceId: updatedProduct.id,
        note: `Ajuste manual de stock: ${previousQuantity} -> ${nextQuantity}`,
        createdByUserId: userId,
      });
    }

    if (Object.keys(changedFields).length > 0) {
      await this.registerProductEvent({
        companyId,
        branchId,
        productId: updatedProduct.id,
        eventType: ProductAuditEventType.UPDATED,
        changedFields,
        createdByUserId: userId,
      });
    }

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

  async remove(
    id: string,
    branchId: string,
    companyId: string | null,
    userId?: string,
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

    const ordersCount = await this.laboratoryOrderRepository
      .createQueryBuilder('order')
      .where('order.branchId = :branchId', { branchId })
      .andWhere(
        '(order.productId = :productId OR :productId = ANY(order.productIds))',
        { productId: id },
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

    const previousQuantity = Number(product.quantity);

    await this.registerStockMovement({
      companyId,
      branchId,
      productId: product.id,
      movementType: 'SALIDA_ELIMINACION',
      quantity: previousQuantity,
      balanceAfter: 0,
      referenceType: 'PRODUCT_DELETE',
      referenceId: product.id,
      note: 'Salida por eliminación lógica de producto',
      createdByUserId: userId,
    });

    await this.registerProductEvent({
      companyId,
      branchId,
      productId: product.id,
      eventType: ProductAuditEventType.DEACTIVATED,
      metadata: {
        name: product.name,
        code: product.code,
        quantityAtDeletion: previousQuantity,
      },
      createdByUserId: userId,
    });

    product.quantity = 0;
    product.isActive = false;
    product.code = `${product.code}__DELETED__${Date.now()}`;

    await this.productRepository.save(product);

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
    branchId: string,
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

    let companyId: string;
    if (companySlug) {
      const company = await this.companyRepository.findOne({
        where: { slug: companySlug, isActive: true },
      });
      if (!company) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: {
            es: 'Empresa con slug no encontrada',
            en: 'Company with slug not found',
          },
        });
      }
      companyId = company.id;
    } else if (companyName) {
      const company = await this.companyRepository.findOne({
        where: [
          { slug: companyName, isActive: true },
          { name: companyName, isActive: true },
        ],
      });
      if (!company) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: {
            es: 'Empresa no encontrada',
            en: 'Company not found',
          },
        });
      }
      companyId = company.id;
    } else {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'Se requiere el nombre o slug de la empresa',
          en: 'Company name or slug is required',
        },
      });
    }

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subcategory', 'subcategory')
      .leftJoinAndSelect('product.branch', 'branch')
      .leftJoinAndSelect('product.createdByUser', 'user')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.companyId = :companyId', { companyId });

    if (queryDto.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.brand ILIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    if (queryDto.brand) {
      queryBuilder.andWhere('LOWER(TRIM(product.brand)) = :brand', {
        brand: queryDto.brand.trim().toLowerCase(),
      });
    }

    const selectedCategoryIds = Array.from(
      new Set([
        ...(queryDto.categoryIds || []),
        ...(queryDto.categoryId ? [queryDto.categoryId] : []),
      ]),
    );

    if (selectedCategoryIds.length > 0) {
      queryBuilder.andWhere('product.categoryId IN (:...categoryIds)', {
        categoryIds: selectedCategoryIds,
      });
    }

    if (queryDto.subcategoryId) {
      queryBuilder.andWhere('product.subcategoryId = :subcategoryId', {
        subcategoryId: queryDto.subcategoryId,
      });
    }

    if (queryDto.branchId) {
      queryBuilder.andWhere('product.branchId = :branchId', {
        branchId: queryDto.branchId,
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

    if (queryDto.inStock === true) {
      queryBuilder.andWhere('product.quantity > :minQuantity', {
        minQuantity: 0,
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

        const discount = await this.findActiveDiscount(
          product.id,
          product.branchId,
        );
        const { finalPrice } = this.calculateFinalPrice(
          Number(product.unitPrice),
          discount,
        );

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
                phone: product.branch.phone,
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
          hasActiveDiscount: !!discount && this.isDiscountActive(discount),
          ...(discount && this.isDiscountActive(discount)
            ? {
                discount: {
                  type: discount.discountType,
                  value: Number(discount.discountValue),
                  finalPrice: Number(finalPrice.toFixed(2)),
                  originalPrice: Number(product.unitPrice),
                },
              }
            : {}),
        };
      }),
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

    const discount = await this.findActiveDiscount(
      product.id,
      product.branchId,
    );
    const { finalPrice } = this.calculateFinalPrice(
      Number(product.unitPrice),
      discount,
    );

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
              phone: product.branch.phone,
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
        hasActiveDiscount: !!discount && this.isDiscountActive(discount),
        ...(discount && this.isDiscountActive(discount)
          ? {
              discount: {
                type: discount.discountType,
                value: Number(discount.discountValue),
                finalPrice: Number(finalPrice.toFixed(2)),
                originalPrice: Number(product.unitPrice),
              },
            }
          : {}),
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

    const brandQueryBuilder = this.productRepository
      .createQueryBuilder('product')
      .select('product.brand', 'brand')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.brand IS NOT NULL')
      .andWhere("TRIM(product.brand) <> ''");

    if (companyId) {
      brandQueryBuilder.andWhere('product.companyId = :companyId', {
        companyId,
      });
    }

    const brandRows = await brandQueryBuilder.getRawMany<{ brand: string }>();
    const brands = this.groupBrandsForPublicFilters(
      brandRows.map((row) => row.brand),
    );

    const branchQueryBuilder = this.branchRepository
      .createQueryBuilder('branch')
      .where('branch.isActive = :isActive', { isActive: true });

    if (companyId) {
      branchQueryBuilder.andWhere('branch.companyId = :companyId', {
        companyId,
      });
    }

    const branches = await branchQueryBuilder
      .select(['branch.id', 'branch.name', 'branch.phone'])
      .orderBy('branch.name', 'ASC')
      .getMany();

    const { groupedCategories, categoryIdMap } =
      this.groupCategoriesForPublicFilters(categories);
    const groupedSubcategories = this.groupSubcategoriesForPublicFilters(
      subcategories,
      categoryIdMap,
    );

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Filtros obtenidos exitosamente',
        en: 'Filters retrieved successfully',
      },
      data: {
        categories: groupedCategories,
        subcategories: groupedSubcategories,
        brands,
        branches,
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
    userId?: string,
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
        const destinationCategory =
          await this.resolveOrCreateDestinationCategory(
            manager,
            sourceProduct,
            transferDto.destinationBranchId,
          );

        const destinationSubcategory =
          await this.resolveOrCreateDestinationSubcategory(
            manager,
            sourceProduct,
            destinationCategory,
            transferDto.destinationBranchId,
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

      const savedDestinationProduct = await manager.save(
        Product,
        destinationProduct,
      );
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
    companyId: string | null,
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
        queryBuilder.andWhere('transfer.sourceBranchId = :branchId', {
          branchId,
        });
      } else if (direction === 'received') {
        queryBuilder.andWhere('transfer.targetBranchId = :branchId', {
          branchId,
        });
      } else {
        queryBuilder.andWhere(
          '(transfer.sourceBranchId = :branchId OR transfer.targetBranchId = :branchId)',
          { branchId },
        );
      }
    }

    if (queryDto.productId) {
      queryBuilder.andWhere(
        '(transfer.sourceProductId = :productId OR transfer.targetProductId = :productId)',
        { productId: queryDto.productId },
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
          .filter((id): id is string => !!id),
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
        (movement) => movement.movementType === 'SALIDA_TRANSFERENCIA',
      );
      const targetMovement = transferMovements.find(
        (movement) => movement.movementType === 'INGRESO_TRANSFERENCIA',
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

  async getStockHistory(
    queryDto: QueryProductStockHistoryDto,
    branchId: string,
    companyId: string | null,
  ) {
    const movementRepository = this.dataSource.getRepository(StockMovement);
    const queryBuilder = movementRepository
      .createQueryBuilder('movement')
      .where('movement.branchId = :branchId', { branchId });

    if (companyId) {
      queryBuilder.andWhere('movement.companyId = :companyId', { companyId });
    }

    if (queryDto.productId) {
      queryBuilder.andWhere('movement.productId = :productId', {
        productId: queryDto.productId,
      });
    }

    const movements = await queryBuilder
      .orderBy('movement.createdAt', 'DESC')
      .limit(100)
      .getMany();

    if (!movements.length) {
      return [];
    }

    const userIds = [
      ...new Set(
        movements
          .map((movement) => movement.createdByUserId)
          .filter((id): id is string => !!id),
      ),
    ];

    const usersById = new Map<string, User>();
    if (userIds.length) {
      const userRepository = this.dataSource.getRepository(User);
      const users = await userRepository.find({ where: { id: In(userIds) } });
      users.forEach((user) => usersById.set(user.id, user));
    }

    return movements.map((movement) => {
      const user = movement.createdByUserId
        ? usersById.get(movement.createdByUserId)
        : undefined;

      return {
        ...movement,
        createdByUser: user
          ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
              email: user.email,
            }
          : null,
      };
    });
  }

  private async resolveOrCreateDestinationCategory(
    manager: any,
    sourceProduct: Product,
    destinationBranchId: string,
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
    destinationBranchId: string,
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
    isCover: boolean = true,
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
        'product_image',
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
          } catch (error) {}

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
      const errorDetails =
        error instanceof Error ? error.message : 'Unexpected error';

      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'Error al subir la imagen del producto',
          en: 'Error uploading product image',
        },
        details: errorDetails,
      });
    }
  }

  private async optimizeAndSaveImage(
    buffer: Buffer,
    filePath: string,
    mimeType: string,
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
    branchId: string,
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
      const errorDetails =
        error instanceof Error ? error.message : 'Unexpected error';

      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'Error al eliminar la imagen del producto',
          en: 'Error deleting product image',
        },
        details: errorDetails,
      });
    }
  }

  private isDiscountActive(discount: ProductDiscount): boolean {
    if (!discount.isActive) return false;

    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) return false;
    if (discount.endDate) {
      const endOfDay = new Date(discount.endDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      if (endOfDay < now) return false;
    }

    return true;
  }

  private calculateFinalPrice(
    unitPrice: number,
    discount: ProductDiscount | null,
  ): { finalPrice: number; hasDiscount: boolean } {
    if (!discount || !this.isDiscountActive(discount)) {
      return { finalPrice: unitPrice, hasDiscount: false };
    }

    let finalPrice = unitPrice;
    if (discount.discountType === DiscountType.PERCENTAGE) {
      finalPrice = unitPrice * (1 - Number(discount.discountValue) / 100);
    } else if (discount.discountType === DiscountType.FIXED_AMOUNT) {
      finalPrice = unitPrice - Number(discount.discountValue);
    }

    return {
      finalPrice: Math.max(finalPrice, 0),
      hasDiscount: true,
    };
  }

  private async findActiveDiscount(
    productId: string,
    branchId: string,
  ): Promise<ProductDiscount | null> {
    return this.productDiscountRepository.findOne({
      where: {
        productId,
        branchId,
      },
    });
  }

  async applyDiscount(
    productId: string,
    branchId: string,
    companyId: string | null,
    dto: CreateApplyDiscountDto,
    userId?: string,
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

    if (
      dto.startDate &&
      dto.endDate &&
      new Date(dto.endDate) <= new Date(dto.startDate)
    ) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'La fecha fin debe ser mayor a la fecha inicio',
          en: 'End date must be greater than start date',
        },
      });
    }

    let discount = await this.findActiveDiscount(productId, branchId);

    if (discount) {
      discount.discountType = dto.discountType;
      discount.discountValue = dto.discountValue;
      discount.isActive = dto.isActive ?? true;
      discount.startDate = dto.startDate || null;
      discount.endDate = dto.endDate || null;
      discount.updatedAt = new Date();
    } else {
      discount = this.productDiscountRepository.create({
        productId,
        branchId,
        companyId: companyId || product.companyId,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        isActive: dto.isActive ?? true,
        startDate: dto.startDate || null,
        endDate: dto.endDate || null,
      });
    }

    await this.productDiscountRepository.save(discount);

    await this.registerProductEvent({
      companyId,
      branchId,
      productId,
      eventType: ProductAuditEventType.DISCOUNT_APPLIED,
      metadata: {
        discountType: dto.discountType,
        discountValue: Number(dto.discountValue),
        isActive: dto.isActive ?? true,
        startDate: dto.startDate ?? null,
        endDate: dto.endDate ?? null,
        productName: product.name,
        productCode: product.code,
      },
      createdByUserId: userId,
    });

    return {
      statusCode: 201,
      success: true,
      message: {
        es: 'Descuento aplicado exitosamente',
        en: 'Discount applied successfully',
      },
      data: discount,
    };
  }

  async removeDiscount(
    productId: string,
    branchId: string,
    companyId?: string | null,
    userId?: string,
  ) {
    const discount = await this.findActiveDiscount(productId, branchId);

    if (!discount) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Descuento no encontrado',
          en: 'Discount not found',
        },
      });
    }

    discount.isActive = false;
    await this.productDiscountRepository.save(discount);

    await this.registerProductEvent({
      companyId: companyId ?? null,
      branchId,
      productId,
      eventType: ProductAuditEventType.DISCOUNT_REMOVED,
      metadata: {
        discountType: discount.discountType,
        discountValue: Number(discount.discountValue),
      },
      createdByUserId: userId,
    });

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Descuento eliminado exitosamente',
        en: 'Discount removed successfully',
      },
    };
  }

  async getProductHistory(
    queryDto: QueryProductHistoryDto,
    branchId: string,
    companyId: string | null,
  ) {
    const queryBuilder = this.productAuditLogRepository
      .createQueryBuilder('audit')
      .where('audit.branchId = :branchId', { branchId });

    if (companyId) {
      queryBuilder.andWhere('audit.companyId = :companyId', { companyId });
    }

    if (queryDto.productId) {
      queryBuilder.andWhere('audit.productId = :productId', {
        productId: queryDto.productId,
      });
    }

    const logs = await queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .limit(200)
      .getMany();

    const hasRealCreated = logs.some((l) => l.eventType === 'CREATED');
    const needsSyntheticCreated = !hasRealCreated && !!queryDto.productId;

    let syntheticCreated: Record<string, any> | null = null;
    if (needsSyntheticCreated) {
      const product = await this.productRepository.findOne({
        where: { id: queryDto.productId, branchId },
        relations: ['createdByUser'],
      });

      if (product) {
        syntheticCreated = {
          id: null,
          productId: product.id,
          branchId: product.branchId,
          companyId: product.companyId,
          eventType: 'CREATED',
          changedFields: null,
          metadata: {
            name: product.name,
            code: product.code,
            brand: product.brand,
            unitPrice: Number(product.unitPrice),
            quantity: Number(product.quantity),
            _synthetic: true,
          },
          createdByUserId: product.createdByUserId,
          createdAt: product.createdAt,
          createdByUser: product.createdByUser
            ? {
                id: product.createdByUser.id,
                firstName: (product.createdByUser as any).firstName,
                lastName: (product.createdByUser as any).lastName,
                username: (product.createdByUser as any).username,
                email: (product.createdByUser as any).email,
              }
            : null,
        };
      }
    }

    if (!logs.length && syntheticCreated) {
      return { statusCode: 200, success: true, data: [syntheticCreated] };
    }

    if (!logs.length) {
      return { statusCode: 200, success: true, data: [] };
    }

    const userIds = [
      ...new Set(
        logs.map((l) => l.createdByUserId).filter((id): id is string => !!id),
      ),
    ];

    const usersById = new Map<string, User>();
    if (userIds.length) {
      const userRepository = this.dataSource.getRepository(User);
      const users = await userRepository.find({ where: { id: In(userIds) } });
      users.forEach((u) => usersById.set(u.id, u));
    }

    const mapped = logs.map((log) => {
      const user = log.createdByUserId
        ? usersById.get(log.createdByUserId)
        : undefined;
      return {
        ...log,
        createdByUser: user
          ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
              email: user.email,
            }
          : null,
      };
    });

    // Agregar el evento CREATED sintético al final (es el más antiguo)
    const data = syntheticCreated ? [...mapped, syntheticCreated] : mapped;

    return { statusCode: 200, success: true, data };
  }

  async getActiveDiscounts(branchId: string, companyId: string | null) {
    const discounts = await this.productDiscountRepository.find({
      where: {
        branchId,
        isActive: true,
        companyId: companyId ?? IsNull(),
      },
      relations: ['product'],
      order: { updatedAt: 'DESC' },
    });

    return {
      statusCode: 200,
      success: true,
      message: {
        es: 'Descuentos obtenidos exitosamente',
        en: 'Discounts retrieved successfully',
      },
      data: discounts,
    };
  }
}
