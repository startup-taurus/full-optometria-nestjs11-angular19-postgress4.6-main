import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Subcategory } from '../subcategories/entities/subcategory.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { File } from '../files/entities/file.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { Company } from '../companies/entities/company.entity';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { QueryProductDto } from './dtos/query-product.dto';
import { PublicQueryProductDto } from './dtos/public-query-product.dto';
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

@Injectable()
export class ProductsService {
  constructor(
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
    private companyRepository: Repository<Company>
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

    const ordersCount = await this.laboratoryOrderRepository.count({
      where: { productId: id, branchId },
    });

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
            console.error(`Error al eliminar imagen antigua: ${error.message}`);
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
      console.error('Error optimizando imagen:', error);
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
