import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UpdateCurrentUserDto } from './dtos/update-current-user.dto';
import { QueryUserDto } from './dtos/query-user.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { FilesService } from '../files/files.service';
import { CompanyFilterUtil } from '../../common/utils/company-filter.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
    private filesService: FilesService
  ) {}

  async create(createUserDto: CreateUserDto) {
    const {
      username,
      email,
      password,
      adress,
      document_number,
      home_phone,
      mobile_phone,
      dateOfBirth,
      ...userData
    } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: {
            es: 'El nombre de usuario ya existe',
            en: 'Username already exists',
          },
        });
      }
      if (existingUser.email === email) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: {
            es: 'El correo electrónico ya existe',
            en: 'Email already exists',
          },
        });
      }
    }

    const resolvedDocumentNumber = document_number || userData.documentNumber;
    const companyId = userData.companyId ?? null;

    if (resolvedDocumentNumber) {
      const existingDocument = await this.userRepository.findOne({
        where: {
          documentNumber: resolvedDocumentNumber,
          companyId,
        },
      });

      if (existingDocument) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: {
            es: 'El número de documento ya existe en esta compañía',
            en: 'Document number already exists in this company',
          },
        });
      }
    }

    const saltRounds =
      this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const userDataMapped = {
      username,
      email,
      passwordHash,
      address: adress || userData.address,
      documentNumber: resolvedDocumentNumber,
      homePhone: home_phone || userData.homePhone,
      mobilePhone: mobile_phone || userData.mobilePhone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      ...userData,
    };

    const user = this.userRepository.create(userDataMapped);

    let savedUser: User;
    try {
      savedUser = await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError: any = error.driverError || {};
        if (driverError.code === '23505') {
          const detail: string =
            typeof driverError.detail === 'string' ? driverError.detail : '';
          const constraint: string =
            typeof driverError.constraint === 'string'
              ? driverError.constraint
              : '';

          const conflictMessageMap: Record<string, { es: string; en: string }> =
            {
              username: {
                es: 'El nombre de usuario ya existe',
                en: 'Username already exists',
              },
              email: {
                es: 'El correo electrónico ya existe',
                en: 'Email already exists',
              },
              document_number: {
                es: 'El número de documento ya existe',
                en: 'Document number already exists',
              },
              documentnumber: {
                es: 'El número de documento ya existe',
                en: 'Document number already exists',
              },
            };

          const detectedKey = (() => {
            if (
              detail.includes('(username)') ||
              constraint.includes('username')
            ) {
              return 'username';
            }
            if (detail.includes('(email)') || constraint.includes('email')) {
              return 'email';
            }
            if (
              detail.includes('(document_number)') ||
              detail.includes('(documentNumber)') ||
              constraint.includes('document_number') ||
              constraint.includes('documentnumber')
            ) {
              return 'document_number';
            }
            return null;
          })();

          if (detectedKey && conflictMessageMap[detectedKey]) {
            throw new ConflictException({
              messageKey: 'ERROR.VALIDATION',
              message: conflictMessageMap[detectedKey],
            });
          }

          throw new ConflictException({
            messageKey: 'ERROR.VALIDATION',
            message: {
              es: 'Ya existe un usuario con los datos únicos proporcionados',
              en: 'User already exists with provided unique data',
            },
          });
        }

        if (driverError.code === '23503') {
          throw new BadRequestException({
            messageKey: 'ERROR.INVALID_RELATION',
            message: {
              es: 'No se encontró la entidad relacionada para crear el usuario',
              en: 'Related entity not found for user creation',
            },
          });
        }
      }

      throw new InternalServerErrorException({
        messageKey: 'ERROR.INTERNAL_SERVER',
        message: {
          es: 'Error inesperado al crear el usuario',
          en: 'Unexpected error while creating user',
        },
      });
    }

    const { passwordHash: _, ...userWithoutPassword } = savedUser;

    return {
      messageKey: 'USER.CREATED',
      message: {
        es: 'Usuario creado correctamente',
        en: 'User created successfully',
      },
      data: userWithoutPassword,
    };
  }

  async findAll(queryDto: QueryUserDto, companyId: string | null) {
    const {
      page,
      limit,
      search,
      firstName,
      lastName,
      email,
      documentNumber,
      mobilePhone,
      address,
      roleId,
      branchId,
      isActive,
      isLocked,
    } = queryDto;

    const { skip, take } = PaginationUtil.getSkipAndTake({ page, limit });

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.branch', 'branch')
      .leftJoinAndSelect('user.company', 'company')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.profilePhoto',
        'user.address',
        'user.documentNumber',
        'user.dateOfBirth',
        'user.homePhone',
        'user.mobilePhone',
        'user.isActive',
        'user.isLocked',
        'user.lastLoginAt',
        'user.createdAt',
        'user.updatedAt',
        'role.id',
        'role.roleName',
        'role.description',
        'branch.id',
        'branch.name',
        'branch.code',
        'company.id',
        'company.name',
      ]);

    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'user', companyId);

    if (search) {
      queryBuilder.andWhere(
        '(user.username ILIKE :search OR user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.documentNumber ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (firstName) {
      queryBuilder.andWhere('user.firstName ILIKE :firstName', {
        firstName: `%${firstName}%`,
      });
    }

    if (lastName) {
      queryBuilder.andWhere('user.lastName ILIKE :lastName', {
        lastName: `%${lastName}%`,
      });
    }

    if (email) {
      queryBuilder.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    }

    if (documentNumber) {
      queryBuilder.andWhere('user.documentNumber ILIKE :documentNumber', {
        documentNumber: `%${documentNumber}%`,
      });
    }

    if (mobilePhone) {
      queryBuilder.andWhere('user.mobilePhone ILIKE :mobilePhone', {
        mobilePhone: `%${mobilePhone}%`,
      });
    }

    if (address) {
      queryBuilder.andWhere('user.address ILIKE :address', {
        address: `%${address}%`,
      });
    }

    if (roleId) {
      queryBuilder.andWhere('user.roleId = :roleId', { roleId });
    }

    if (branchId) {
      queryBuilder.andWhere('user.branchId = :branchId', { branchId });
    }

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    if (typeof isLocked === 'boolean') {
      queryBuilder.andWhere('user.isLocked = :isLocked', { isLocked });
    }

    const totalCount = await queryBuilder.getCount();

    const users = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    const paginatedResult = PaginationUtil.paginate(users, totalCount, {
      page,
      limit,
    });

    return {
      messageKey: 'USER.FOUND',
      data: paginatedResult,
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'branch', 'company'],
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePhoto: true,
        address: true,
        documentNumber: true,
        dateOfBirth: true,
        homePhone: true,
        mobilePhone: true,
        isActive: true,
        isLocked: true,
        failedLoginAttempts: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          id: true,
          roleName: true,
          description: true,
        },
        branch: {
          id: true,
          name: true,
          code: true,
        },
        company: {
          id: true,
          name: true,
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    return {
      messageKey: 'USER.FETCHED',
      data: user,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    const {
      password,
      username,
      email,
      dateOfBirth,
      adress,
      document_number,
      home_phone,
      mobile_phone,
      ...updateData
    } = updateUserDto;

    if (username && username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username },
      });
      if (existingUser) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: {
            es: 'El nombre de usuario ya existe',
            en: 'Username already exists',
          },
        });
      }
    }

    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: {
            es: 'El correo electrónico ya existe',
            en: 'Email already exists',
          },
        });
      }
    }

    let passwordHash = user.passwordHash;
    if (password) {
      const saltRounds =
        this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    }

    const updateDataMapped = {
      username,
      email,
      passwordHash,
      address: adress || updateData.address,
      documentNumber: document_number || updateData.documentNumber,
      homePhone: home_phone || updateData.homePhone,
      mobilePhone: mobile_phone || updateData.mobilePhone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      ...updateData,
    };

    delete (updateDataMapped as any).companyId;
    delete (updateDataMapped as any).branchId;

    Object.keys(updateDataMapped).forEach((key) => {
      if (updateDataMapped[key] === undefined) {
        delete updateDataMapped[key];
      }
    });

    await this.userRepository.update(id, updateDataMapped);

    const updatedUser = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'company'],
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePhoto: true,
        isActive: true,
        isLocked: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          id: true,
          roleName: true,
          description: true,
        },
        company: {
          id: true,
          name: true,
        },
      },
    });

    return {
      messageKey: 'USER.UPDATED',
      data: updatedUser,
    };
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    const shiftsCount = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('shifts', 'shift', 'shift.user_id = user.id')
      .where('user.id = :id', { id })
      .select('COUNT(shift.id)', 'count')
      .getRawOne();

    if (parseInt(shiftsCount.count) > 0) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el usuario ${user.firstName} ${
            user.lastName
          } porque tiene ${shiftsCount.count} turno${
            parseInt(shiftsCount.count) > 1 ? 's' : ''
          } asociado${
            parseInt(shiftsCount.count) > 1 ? 's' : ''
          }. Primero elimine los turnos.`,
          en: `Cannot delete user ${user.firstName} ${
            user.lastName
          } because it has ${shiftsCount.count} associated shift${
            parseInt(shiftsCount.count) > 1 ? 's' : ''
          }. Please delete the shifts first.`,
        },
      });
    }

    // Verificar si el usuario tiene historias clínicas asociadas
    const clinicalHistoriesCount = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('clinical_histories', 'history', 'history.user_id = user.id')
      .where('user.id = :id', { id })
      .select('COUNT(history.id)', 'count')
      .getRawOne();

    if (parseInt(clinicalHistoriesCount.count) > 0) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el usuario ${user.firstName} ${
            user.lastName
          } porque tiene ${clinicalHistoriesCount.count} historia${
            parseInt(clinicalHistoriesCount.count) > 1 ? 's' : ''
          } clínica${
            parseInt(clinicalHistoriesCount.count) > 1 ? 's' : ''
          } asociada${
            parseInt(clinicalHistoriesCount.count) > 1 ? 's' : ''
          }. Primero elimine las historias clínicas.`,
          en: `Cannot delete user ${user.firstName} ${
            user.lastName
          } because it has ${
            clinicalHistoriesCount.count
          } associated clinical histor${
            parseInt(clinicalHistoriesCount.count) > 1 ? 'ies' : 'y'
          }. Please delete the clinical histories first.`,
        },
      });
    }

    // Verificar si el usuario tiene órdenes de laboratorio asociadas
    const laboratoryOrdersCount = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('laboratory_orders', 'order', 'order.user_id = user.id')
      .where('user.id = :id', { id })
      .select('COUNT(order.id)', 'count')
      .getRawOne();

    if (parseInt(laboratoryOrdersCount.count) > 0) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el usuario ${user.firstName} ${
            user.lastName
          } porque tiene ${laboratoryOrdersCount.count} orden${
            parseInt(laboratoryOrdersCount.count) > 1 ? 'es' : ''
          } de laboratorio asociada${
            parseInt(laboratoryOrdersCount.count) > 1 ? 's' : ''
          }. Primero elimine las órdenes de laboratorio.`,
          en: `Cannot delete user ${user.firstName} ${
            user.lastName
          } because it has ${
            laboratoryOrdersCount.count
          } associated laboratory order${
            parseInt(laboratoryOrdersCount.count) > 1 ? 's' : ''
          }. Please delete the laboratory orders first.`,
        },
      });
    }

    // Verificar si el usuario creó productos
    const productsCount = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('products', 'product', 'product.created_by_user_id = user.id')
      .where('user.id = :id', { id })
      .select('COUNT(product.id)', 'count')
      .getRawOne();

    if (parseInt(productsCount.count) > 0) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el usuario ${user.firstName} ${
            user.lastName
          } porque creó ${productsCount.count} producto${
            parseInt(productsCount.count) > 1 ? 's' : ''
          }. Primero reasigne o elimine los productos.`,
          en: `Cannot delete user ${user.firstName} ${
            user.lastName
          } because created ${productsCount.count} product${
            parseInt(productsCount.count) > 1 ? 's' : ''
          }. Please reassign or delete the products first.`,
        },
      });
    }

    await this.userRepository.remove(user);

    return {
      messageKey: 'USER.DELETED',
      data: { id },
    };
  }

  async findByRole(roleName: string): Promise<User[]> {
    return this.userRepository.find({
      where: {
        role: { roleName },
      },
      relations: ['role'],
    });
  }

  async validateCurrentPassword(userId: string, currentPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Usuario no encontrado',
          en: 'User not found',
        },
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException({
        messageKey: 'ERROR.INVALID_CURRENT_PASSWORD',
        message: {
          es: 'La contraseña actual es incorrecta',
          en: 'Current password is incorrect',
        },
      });
    }

    return {
      messageKey: 'USER.PASSWORD_VALIDATED',
      data: { valid: true },
    };
  }

  async updateCurrent(
    userId: string,
    updateCurrentUserDto: UpdateCurrentUserDto,
    profilePhoto?: Express.Multer.File
  ): Promise<any> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException({
          messageKey: 'ERROR.NOT_FOUND',
          message: {
            es: 'Usuario no encontrado',
            en: 'User not found',
          },
        });
      }

      const { currentPassword, newPassword, email, ...updateData } =
        updateCurrentUserDto;

      if (email && email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email },
        });
        if (existingUser) {
          throw new ConflictException({
            messageKey: 'ERROR.VALIDATION',
            message: {
              es: 'El correo electrónico ya existe',
              en: 'Email already exists',
            },
          });
        }
      }

      let passwordHash = user.passwordHash;
      if (currentPassword && newPassword) {
        const isCurrentPasswordValid = await bcrypt.compare(
          currentPassword,
          user.passwordHash
        );
        if (!isCurrentPasswordValid) {
          throw new UnauthorizedException({
            messageKey: 'ERROR.INVALID_CURRENT_PASSWORD',
            message: {
              es: 'La contraseña actual es incorrecta',
              en: 'Current password is incorrect',
            },
          });
        }

        const saltRounds =
          this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
        passwordHash = await bcrypt.hash(newPassword, saltRounds);
      } else if (currentPassword || newPassword) {
        throw new BadRequestException({
          messageKey: 'ERROR.BOTH_PASSWORDS_REQUIRED',
          message: {
            es: 'Debes ingresar la contraseña actual y la nueva para cambiarla',
            en: 'Both current password and new password are required for password change',
          },
        });
      }

      let profilePhotoPath = user.profilePhoto;
      if (profilePhoto) {
        try {
          const uploadResult = await this.filesService.uploadFile(
            profilePhoto,
            {
              entityType: 'user',
              entityId: userId,
              fileCategory: 'profile_photo',
            }
          );

          if (uploadResult.data && uploadResult.data.url) {
            profilePhotoPath = uploadResult.data.url;
          }
        } catch (fileError) {
          throw fileError;
        }
      }

      await this.userRepository.update(userId, {
        email,
        passwordHash,
        profilePhoto: profilePhotoPath,
        ...updateData,
      });

      const updatedUser = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['role', 'company'],
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          profilePhoto: true,
          address: true,
          documentNumber: true,
          dateOfBirth: true,
          homePhone: true,
          mobilePhone: true,
          isActive: true,
          isLocked: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          role: {
            id: true,
            roleName: true,
            description: true,
          },
          company: {
            id: true,
            name: true,
          },
        },
      });

      return {
        messageKey: 'USER.PROFILE_UPDATED',
        data: updatedUser,
      };
    } catch (error) {
      throw error;
    }
  }

  async searchUsers(query: string) {
    if (!query || query.trim().length < 2) {
      return {
        messageKey: 'USER.SEARCH_QUERY_TOO_SHORT',
        data: [],
      };
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.branch', 'branch')
      .leftJoinAndSelect('user.company', 'company')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.documentNumber',
        'user.mobilePhone',
        'user.profilePhoto',
        'user.branchId',
        'branch.id',
        'branch.name',
        'branch.code',
        'company.id',
        'company.name',
      ])
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere(
        '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query OR user.documentNumber ILIKE :query)',
        { query: `%${query.trim()}%` }
      )
      .orderBy('user.firstName', 'ASC')
      .limit(20)
      .getMany();

    return {
      messageKey: 'USER.SEARCH_RESULTS',
      data: users,
    };
  }
}
