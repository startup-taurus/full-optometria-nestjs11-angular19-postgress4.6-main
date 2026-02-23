import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { CreateCompanyCompleteDto } from './dtos/create-company-complete.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { QueryCompanyDto } from './dtos/query-company.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { BranchesService } from '../branches/branches.service';
import { RolesService } from '../roles-permissions/roles/roles.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permissions/entities/role.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Subcategory } from '../subcategories/entities/subcategory.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Shift } from '../shift-management/entities/shift.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { ClinicalHistory } from '../clinical-histories/entities/clinical-history.entity';
import { ClinicalFormConfig } from '../clinical-form-config/entities/clinical-form-config.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(Shift)
    private shiftRepository: Repository<Shift>,
    @InjectRepository(LaboratoryOrder)
    private laboratoryOrderRepository: Repository<LaboratoryOrder>,
    @InjectRepository(ClinicalHistory)
    private clinicalHistoryRepository: Repository<ClinicalHistory>,
    @InjectRepository(ClinicalFormConfig)
    private clinicalFormConfigRepository: Repository<ClinicalFormConfig>,
    private branchesService: BranchesService,
    private rolesService: RolesService,
    private usersService: UsersService
  ) {}

  async create(createCompanyDto: CreateCompanyDto) {
    const { name, code, slug } = createCompanyDto;

    const existingByName = await this.companyRepository.findOne({
      where: { name },
    });

    if (existingByName) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: 'Company name already exists',
      });
    }

    const existingByCode = await this.companyRepository.findOne({
      where: { code },
    });

    if (existingByCode) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: 'Company code already exists',
      });
    }

    if (slug) {
      const existingBySlug = await this.companyRepository.findOne({
        where: { slug },
      });

      if (existingBySlug) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: 'Company slug already exists',
        });
      }
    }

    const company = this.companyRepository.create(createCompanyDto);
    const savedCompany = await this.companyRepository.save(company);

    return {
      messageKey: 'COMPANY.CREATED',
      data: savedCompany,
    };
  }

  async createComplete(createCompanyCompleteDto: CreateCompanyCompleteDto) {
    const {
      name,
      code,
      companyEmail,
      companyPhone,
      slug,
      branchName,
      branchCode,
      branchAddress,
      branchCity,
      username,
      email,
      firstName,
      lastName,
      password,
      documentNumber,
      mobilePhone,
    } = createCompanyCompleteDto;

    const existingByName = await this.companyRepository.findOne({
      where: { name },
    });

    if (existingByName) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: 'Company name already exists',
      });
    }

    const existingByCode = await this.companyRepository.findOne({
      where: { code },
    });

    if (existingByCode) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: 'Company code already exists',
      });
    }

    if (slug) {
      const existingBySlug = await this.companyRepository.findOne({
        where: { slug },
      });

      if (existingBySlug) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: 'Company slug already exists',
        });
      }
    }

    let savedCompany: Company;
    let adminRole: any;
    let branch: any;
    let user: any;

    try {
      const company = this.companyRepository.create({
        name,
        code,
        email: companyEmail,
        phone: companyPhone,
        slug,
      });
      savedCompany = await this.companyRepository.save(company);

      try {
        adminRole = await this.rolesService.create({
          roleName: 'Administrador',
          description: 'Rol de administrador de la compañia',
          companyId: savedCompany.id,
        });

        try {
          branch = await this.branchesService.create({
            companyId: savedCompany.id,
            name: branchName,
            code: branchCode,
            address: branchAddress,
            city: branchCity,
          });

          try {
            user = await this.usersService.create({
              username,
              email,
              firstName,
              lastName,
              password,
              roleId: adminRole.data.id,
              companyId: savedCompany.id,
              branchId: branch.data.id,
              documentNumber,
              mobilePhone,
            });

            return {
              messageKey: 'COMPANY.CREATED_COMPLETE',
              data: {
                company: savedCompany,
                role: adminRole.data,
                branch: branch.data,
                user: {
                  id: user.data.id,
                  username: user.data.username,
                  email: user.data.email,
                  firstName: user.data.firstName,
                  lastName: user.data.lastName,
                },
              },
            };
          } catch (userError) {
            await this.branchesService.remove(branch.data.id, null);
            throw userError;
          }
        } catch (branchError) {
          await this.rolesService.remove(adminRole.data.id);
          throw branchError;
        }
      } catch (roleError) {
        await this.companyRepository.remove(savedCompany);
        throw roleError;
      }
    } catch (companyError) {
      throw companyError;
    }
  }

  async findAll(queryDto: QueryCompanyDto) {
    const { page, limit, search, name, code, isActive } = queryDto;
    const { skip, take } = PaginationUtil.getSkipAndTake({ page, limit });

    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.logoFile', 'logoFile');

    if (search) {
      queryBuilder.andWhere(
        '(company.name ILIKE :search OR company.code ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (name) {
      queryBuilder.andWhere('company.name ILIKE :name', { name: `%${name}%` });
    }

    if (code) {
      queryBuilder.andWhere('company.code ILIKE :code', { code: `%${code}%` });
    }

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('company.isActive = :isActive', { isActive });
    }

    const totalCount = await queryBuilder.getCount();

    const companies = await queryBuilder
      .orderBy('company.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    const paginatedResult = PaginationUtil.paginate(companies, totalCount, {
      page,
      limit,
    });

    return {
      messageKey: 'COMPANY.FOUND',
      data: paginatedResult,
    };
  }

  async findAllForSelector() {
    const companies = await this.companyRepository.find({
      where: { isActive: true },
      select: ['id', 'name', 'code'],
      order: { name: 'ASC' },
    });

    return {
      messageKey: 'COMPANY.SELECTOR_DATA',
      data: companies,
    };
  }

  async findOne(id: string) {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['logoFile'],
    });

    if (!company) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    return {
      messageKey: 'COMPANY.FETCHED',
      data: company,
    };
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['logoFile'],
    });

    if (!company) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    const { name, code } = updateCompanyDto;
    const { slug } = updateCompanyDto;

    if (name && name !== company.name) {
      const existingCompany = await this.companyRepository.findOne({
        where: { name },
      });
      if (existingCompany) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: 'Company name already exists',
        });
      }
    }

    if (code && code !== company.code) {
      const existingCompany = await this.companyRepository.findOne({
        where: { code },
      });
      if (existingCompany) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: 'Company code already exists',
        });
      }
    }

    if (slug && slug !== company.slug) {
      const existingCompany = await this.companyRepository.findOne({
        where: { slug },
      });
      if (existingCompany) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: 'Company slug already exists',
        });
      }
    }

    await this.companyRepository.update(id, updateCompanyDto);

    const updatedCompany = await this.companyRepository.findOne({
      where: { id },
      relations: ['logoFile'],
    });

    return {
      messageKey: 'COMPANY.UPDATED',
      data: updatedCompany,
    };
  }

  async remove(id: string) {
    const company = await this.companyRepository.findOne({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    // Verificar branches
    const branchesCount = await this.branchesService.findAll(
      { page: 1, limit: 1 },
      company.id
    );

    if (branchesCount.data.totalCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la compañia ${company.name} porque tiene ${
            branchesCount.data.totalCount
          } sucursal${branchesCount.data.totalCount > 1 ? 'es' : ''} asociada${
            branchesCount.data.totalCount > 1 ? 's' : ''
          }. Primero elimine o reasigne las sucursales.`,
          en: `Cannot delete company ${company.name} because it has ${
            branchesCount.data.totalCount
          } associated branch${
            branchesCount.data.totalCount > 1 ? 'es' : ''
          }. Please delete or reassign the branches first.`,
        },
      });
    }

    const usersCount = await this.userRepository.count({
      where: { companyId: id },
    });

    if (usersCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la compañia ${
            company.name
          } porque tiene ${usersCount} usuario${
            usersCount > 1 ? 's' : ''
          } asociado${
            usersCount > 1 ? 's' : ''
          }. Primero elimine o reasigne los usuarios.`,
          en: `Cannot delete company ${
            company.name
          } because it has ${usersCount} associated user${
            usersCount > 1 ? 's' : ''
          }. Please delete or reassign the users first.`,
        },
      });
    }

    const rolesCount = await this.roleRepository.count({
      where: { companyId: id },
    });

    if (rolesCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la compañia ${
            company.name
          } porque tiene ${rolesCount} rol${
            rolesCount > 1 ? 'es' : ''
          } asociado${
            rolesCount > 1 ? 's' : ''
          }. Primero elimine o reasigne los roles.`,
          en: `Cannot delete company ${
            company.name
          } because it has ${rolesCount} associated role${
            rolesCount > 1 ? 's' : ''
          }. Please delete or reassign the roles first.`,
        },
      });
    }

    const productsCount = await this.productRepository.count({
      where: { companyId: id },
    });

    if (productsCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la compañia ${
            company.name
          } porque tiene ${productsCount} producto${
            productsCount > 1 ? 's' : ''
          } asociado${
            productsCount > 1 ? 's' : ''
          }. Primero elimine o reasigne los productos.`,
          en: `Cannot delete company ${
            company.name
          } because it has ${productsCount} associated product${
            productsCount > 1 ? 's' : ''
          }. Please delete or reassign the products first.`,
        },
      });
    }

    const categoriesCount = await this.categoryRepository.count({
      where: { companyId: id },
    });

    if (categoriesCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la compañia ${
            company.name
          } porque tiene ${categoriesCount} categoría${
            categoriesCount > 1 ? 's' : ''
          } asociada${
            categoriesCount > 1 ? 's' : ''
          }. Primero elimine o reasigne las categorías.`,
          en: `Cannot delete company ${
            company.name
          } because it has ${categoriesCount} associated categor${
            categoriesCount > 1 ? 'ies' : 'y'
          }. Please delete or reassign the categories first.`,
        },
      });
    }

    const subcategoriesCount = await this.subcategoryRepository.count({
      where: { companyId: id },
    });

    if (subcategoriesCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la compañia ${
            company.name
          } porque tiene ${subcategoriesCount} subcategoría${
            subcategoriesCount > 1 ? 's' : ''
          } asociada${
            subcategoriesCount > 1 ? 's' : ''
          }. Primero elimine o reasigne las subcategorías.`,
          en: `Cannot delete company ${
            company.name
          } because it has ${subcategoriesCount} associated subcategor${
            subcategoriesCount > 1 ? 'ies' : 'y'
          }. Please delete or reassign the subcategories first.`,
        },
      });
    }

    const suppliersCount = await this.supplierRepository.count({
      where: { companyId: id },
    });

    if (suppliersCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la compañia ${
            company.name
          } porque tiene ${suppliersCount} proveedor${
            suppliersCount > 1 ? 'es' : ''
          } asociado${
            suppliersCount > 1 ? 's' : ''
          }. Primero elimine o reasigne los proveedores.`,
          en: `Cannot delete company ${
            company.name
          } because it has ${suppliersCount} associated supplier${
            suppliersCount > 1 ? 's' : ''
          }. Please delete or reassign the suppliers first.`,
        },
      });
    }

    const shiftsCount = await this.shiftRepository.count({
      where: { companyId: id },
    });

    if (shiftsCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la compañia ${
            company.name
          } porque tiene ${shiftsCount} turno${
            shiftsCount > 1 ? 's' : ''
          } asociado${shiftsCount > 1 ? 's' : ''}. Primero elimine los turnos.`,
          en: `Cannot delete company ${
            company.name
          } because it has ${shiftsCount} associated shift${
            shiftsCount > 1 ? 's' : ''
          }. Please delete the shifts first.`,
        },
      });
    }

    const laboratoryOrdersCount = await this.laboratoryOrderRepository.count({
      where: { companyId: id },
    });

    if (laboratoryOrdersCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la compañia ${
            company.name
          } porque tiene ${laboratoryOrdersCount} orden${
            laboratoryOrdersCount > 1 ? 'es' : ''
          } de laboratorio asociada${
            laboratoryOrdersCount > 1 ? 's' : ''
          }. Primero elimine las órdenes de laboratorio.`,
          en: `Cannot delete company ${
            company.name
          } because it has ${laboratoryOrdersCount} associated laboratory order${
            laboratoryOrdersCount > 1 ? 's' : ''
          }. Please delete the laboratory orders first.`,
        },
      });
    }

    const clinicalHistoriesCount = await this.clinicalHistoryRepository.count({
      where: { companyId: id },
    });

    if (clinicalHistoriesCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la compañia ${
            company.name
          } porque tiene ${clinicalHistoriesCount} historia${
            clinicalHistoriesCount > 1 ? 's' : ''
          } clínica${clinicalHistoriesCount > 1 ? 's' : ''} asociada${
            clinicalHistoriesCount > 1 ? 's' : ''
          }. Primero elimine las historias clínicas.`,
          en: `Cannot delete company ${
            company.name
          } because it has ${clinicalHistoriesCount} associated clinical histor${
            clinicalHistoriesCount > 1 ? 'ies' : 'y'
          }. Please delete the clinical histories first.`,
        },
      });
    }

    const clinicalFormConfigsCount =
      await this.clinicalFormConfigRepository.count({
        where: { companyId: id },
      });

    if (clinicalFormConfigsCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        success: false,
        message: {
          es: `No se puede eliminar la compañia ${
            company.name
          } porque tiene ${clinicalFormConfigsCount} configuración${
            clinicalFormConfigsCount > 1 ? 'es' : ''
          } de formulario${clinicalFormConfigsCount > 1 ? 's' : ''} clínico${
            clinicalFormConfigsCount > 1 ? 's' : ''
          } asociada${
            clinicalFormConfigsCount > 1 ? 's' : ''
          }. Primero elimine las configuraciones de formularios clínicos.`,
          en: `Cannot delete company ${
            company.name
          } because it has ${clinicalFormConfigsCount} associated clinical form config${
            clinicalFormConfigsCount > 1 ? 's' : ''
          }. Please delete the clinical form configs first.`,
        },
      });
    }

    await this.companyRepository.remove(company);

    return {
      messageKey: 'COMPANY.DELETED',
      data: { id },
    };
  }
}
