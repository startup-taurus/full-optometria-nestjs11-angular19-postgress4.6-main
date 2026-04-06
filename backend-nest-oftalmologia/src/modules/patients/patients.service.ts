import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  QueryFailedError,
  SelectQueryBuilder,
  DeleteQueryBuilder,
} from 'typeorm';
import { Patient } from './entities/patient.entity';
import { Client } from './entities/client.entity';
import { CreatePatientDto } from './dtos/create-patient.dto';
import { UpdatePatientDto } from './dtos/update-patient.dto';
import { QueryPatientDto } from './dtos/query-patient.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { CompanyFilterUtil } from '../../common/utils/company-filter.util';
import { FilesService } from '../files/files.service';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private filesService: FilesService
  ) {}

  private applyClientCompanyScope(
    queryBuilder: SelectQueryBuilder<Client> | DeleteQueryBuilder<Client>,
    companyId: string | null
  ): void {
    if (companyId) {
      queryBuilder.andWhere('client.companyId = :companyId', { companyId });
      return;
    }

    queryBuilder.andWhere('client.companyId IS NULL');
  }

  private async countAssociatedClients(
    patientId: string,
    branchId: string,
    companyId: string | null
  ): Promise<number> {
    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .innerJoin('client_patients', 'cp', 'cp.client_id = client.id')
      .where('cp.patient_id = :patientId', { patientId })
      .andWhere('client.branchId = :branchId', { branchId });

    if (companyId) {
      queryBuilder.andWhere('client.companyId = :companyId', { companyId });
    } else {
      queryBuilder.andWhere('client.companyId IS NULL');
    }

    const result = await queryBuilder
      .select('COUNT(DISTINCT client.id)', 'count')
      .getRawOne();
    return Number(result?.count || 0);
  }

  private async deleteAssociatedClients(
    patientId: string,
    branchId: string,
    companyId: string | null
  ): Promise<number> {
    const associatedClientsQuery = this.clientRepository
      .createQueryBuilder('client')
      .innerJoin('client_patients', 'cp', 'cp.client_id = client.id')
      .where('cp.patient_id = :patientId', { patientId })
      .andWhere('client.branchId = :branchId', { branchId });

    if (companyId) {
      associatedClientsQuery.andWhere('client.companyId = :companyId', { companyId });
    } else {
      associatedClientsQuery.andWhere('client.companyId IS NULL');
    }

    const associatedClients = await associatedClientsQuery
      .select('client.id', 'id')
      .getRawMany<{ id: string }>();

    let deletedClientsCount = 0;

    for (const associatedClient of associatedClients) {
      const links = await this.clientRepository.query(
        'SELECT patient_id FROM client_patients WHERE client_id = $1',
        [associatedClient.id]
      );

      const remainingPatientIds = links
        .map((row: { patient_id: string }) => row.patient_id)
        .filter((id: string) => id !== patientId);

      if (!remainingPatientIds.length) {
        await this.clientRepository.delete({ id: associatedClient.id });
        deletedClientsCount += 1;
        continue;
      }

      await this.clientRepository.query(
        'DELETE FROM client_patients WHERE client_id = $1 AND patient_id = $2',
        [associatedClient.id, patientId]
      );

      await this.clientRepository.update(associatedClient.id, {
        patientId: remainingPatientIds[0],
      });
    }

    return deletedClientsCount;
  }

  async create(
    createPatientDto: CreatePatientDto,
    branchId: string,
    companyId: string | null
  ) {
    const {
      email,
      documentNumber,
      dateOfBirth,
      companyId: _,
      branchId: __,
      ...patientData
    } = createPatientDto;

    const existingPatient = await this.patientRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingPatient) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'El correo electrónico ya existe',
          en: 'Email already exists',
        },
      });
    }

    const resolvedCompanyId = companyId;
    const existingDocument = await this.patientRepository.findOne({
      where: {
        documentNumber,
        companyId: resolvedCompanyId,
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

    const patient = this.patientRepository.create({
      email: email.toLowerCase(),
      documentNumber,
      companyId: resolvedCompanyId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      ...patientData,
      branchId,
    });

    let savedPatient: Patient;
    try {
      savedPatient = await this.patientRepository.save(patient);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError: any = error.driverError || {};
        if (driverError.code === '23505') {
          throw new ConflictException({
            messageKey: 'ERROR.VALIDATION',
            message: {
              es: 'Ya existe un paciente con los datos únicos proporcionados',
              en: 'Patient already exists with provided unique data',
            },
          });
        }

        if (driverError.code === '23503') {
          throw new ConflictException({
            messageKey: 'ERROR.INVALID_RELATION',
            message: {
              es: 'No se encontró la entidad relacionada para crear el paciente',
              en: 'Related entity not found for patient creation',
            },
          });
        }
      }

      throw new InternalServerErrorException({
        messageKey: 'ERROR.INTERNAL_SERVER',
        message: {
          es: 'Error inesperado al crear el paciente',
          en: 'Unexpected error while creating patient',
        },
      });
    }

    return {
      messageKey: 'PATIENT.CREATED',
      message: {
        es: 'Paciente creado correctamente',
        en: 'Patient created successfully',
      },
      data: savedPatient,
    };
  }

  async findAll(
    queryDto: QueryPatientDto,
    selectedBranchId: string,
    companyId: string | null
  ) {
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
      isActive,
    } = queryDto;

    const { skip, take } = PaginationUtil.getSkipAndTake({ page, limit });

    const queryBuilder = this.patientRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.branch', 'branch')
      .leftJoinAndSelect('patient.company', 'company')
      .select([
        'patient.id',
        'patient.firstName',
        'patient.lastName',
        'patient.email',
        'patient.documentNumber',
        'patient.dateOfBirth',
        'patient.address',
        'patient.homePhone',
        'patient.mobilePhone',
        'patient.profilePhoto',
        'patient.isActive',
        'patient.createdAt',
        'patient.updatedAt',
        'branch.id',
        'branch.name',
        'branch.code',
        'company.id',
        'company.name',
      ]);

    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'patient', companyId);
    queryBuilder.andWhere('patient.branchId = :branchId', {
      branchId: selectedBranchId,
    });

    if (search) {
      queryBuilder.andWhere(
        '(patient.firstName ILIKE :search OR patient.lastName ILIKE :search OR patient.email ILIKE :search OR patient.documentNumber ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (firstName) {
      queryBuilder.andWhere('patient.firstName ILIKE :firstName', {
        firstName: `%${firstName}%`,
      });
    }

    if (lastName) {
      queryBuilder.andWhere('patient.lastName ILIKE :lastName', {
        lastName: `%${lastName}%`,
      });
    }

    if (email) {
      queryBuilder.andWhere('patient.email ILIKE :email', {
        email: `%${email}%`,
      });
    }

    if (documentNumber) {
      queryBuilder.andWhere('patient.documentNumber ILIKE :documentNumber', {
        documentNumber: `%${documentNumber}%`,
      });
    }

    if (mobilePhone) {
      queryBuilder.andWhere('patient.mobilePhone ILIKE :mobilePhone', {
        mobilePhone: `%${mobilePhone}%`,
      });
    }

    if (address) {
      queryBuilder.andWhere('patient.address ILIKE :address', {
        address: `%${address}%`,
      });
    }

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('patient.isActive = :isActive', { isActive });
    }

    const totalCount = await queryBuilder.getCount();

    const patients = await queryBuilder
      .orderBy('patient.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    const paginatedResult = PaginationUtil.paginate(patients, totalCount, {
      page,
      limit,
    });

    return {
      messageKey: 'PATIENT.FOUND',
      data: paginatedResult,
    };
  }

  async findOne(id: string, branchId: string, companyId: string | null) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );

    const patient = await this.patientRepository.findOne({
      where: whereCondition,
      relations: ['branch', 'company'],
    });

    if (!patient) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Paciente no encontrado',
          en: 'Patient not found',
        },
      });
    }

    return {
      messageKey: 'PATIENT.FETCHED',
      data: patient,
    };
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
    branchId: string,
    companyId: string | null
  ) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );

    const patient = await this.patientRepository.findOne({
      where: whereCondition,
    });

    if (!patient) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Paciente no encontrado',
          en: 'Patient not found',
        },
      });
    }

    const { email, documentNumber, dateOfBirth, ...updateData } =
      updatePatientDto;

    if (email && email.toLowerCase() !== patient.email) {
      const existingPatient = await this.patientRepository.findOne({
        where: { email: email.toLowerCase() },
      });
      if (existingPatient) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: {
            es: 'El correo electrónico ya existe',
            en: 'Email already exists',
          },
        });
      }
    }

    if (documentNumber && documentNumber !== patient.documentNumber) {
      const existingPatient = await this.patientRepository.findOne({
        where: {
          documentNumber,
          companyId: patient.companyId,
        },
      });
      if (existingPatient) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: {
            es: 'El número de documento ya existe en esta compañía',
            en: 'Document number already exists in this company',
          },
        });
      }
    }

    const updateDataMapped = {
      email: email ? email.toLowerCase() : undefined,
      documentNumber,
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

    await this.patientRepository.update({ id, branchId }, updateDataMapped);

    const updatedPatient = await this.patientRepository.findOne({
      where: CompanyFilterUtil.buildWhereCondition({ id, branchId }, companyId),
      relations: ['branch', 'company'],
    });

    return {
      messageKey: 'PATIENT.UPDATED',
      message: {
        es: 'Paciente actualizado correctamente',
        en: 'Patient updated successfully',
      },
      data: updatedPatient,
    };
  }

  async remove(
    id: string,
    branchId: string,
    companyId: string | null,
    deleteAssociatedClients: boolean = false
  ) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );

    const patient = await this.patientRepository.findOne({
      where: whereCondition,
    });

    if (!patient) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Paciente no encontrado',
          en: 'Patient not found',
        },
      });
    }

    const shiftsCount = await this.patientRepository
      .createQueryBuilder('patient')
      .leftJoin('shifts', 'shift', 'shift.patient_id = patient.id')
      .where('patient.id = :id', { id })
      .select('COUNT(shift.id)', 'count')
      .getRawOne();

    if (parseInt(shiftsCount.count) > 0) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el paciente ${patient.firstName} ${
            patient.lastName
          } porque tiene ${shiftsCount.count} turno${
            parseInt(shiftsCount.count) > 1 ? 's' : ''
          } asociado${
            parseInt(shiftsCount.count) > 1 ? 's' : ''
          }. Primero elimine los turnos.`,
          en: `Cannot delete patient ${patient.firstName} ${
            patient.lastName
          } because it has ${shiftsCount.count} associated shift${
            parseInt(shiftsCount.count) > 1 ? 's' : ''
          }. Please delete the shifts first.`,
        },
      });
    }

    const clinicalHistoriesCount = await this.patientRepository
      .createQueryBuilder('patient')
      .leftJoin(
        'clinical_histories',
        'history',
        'history.patient_id = patient.id'
      )
      .where('patient.id = :id', { id })
      .select('COUNT(history.id)', 'count')
      .getRawOne();

    if (parseInt(clinicalHistoriesCount.count) > 0) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el paciente ${patient.firstName} ${
            patient.lastName
          } porque tiene ${clinicalHistoriesCount.count} historia${
            parseInt(clinicalHistoriesCount.count) > 1 ? 's' : ''
          } clínica${
            parseInt(clinicalHistoriesCount.count) > 1 ? 's' : ''
          } asociada${
            parseInt(clinicalHistoriesCount.count) > 1 ? 's' : ''
          }. Primero elimine las historias clínicas.`,
          en: `Cannot delete patient ${patient.firstName} ${
            patient.lastName
          } because it has ${
            clinicalHistoriesCount.count
          } associated clinical histor${
            parseInt(clinicalHistoriesCount.count) > 1 ? 'ies' : 'y'
          }. Please delete the clinical histories first.`,
        },
      });
    }

    const laboratoryOrdersCount = await this.patientRepository
      .createQueryBuilder('patient')
      .leftJoin('laboratory_orders', 'order', 'order.patient_id = patient.id')
      .where('patient.id = :id', { id })
      .select('COUNT(order.id)', 'count')
      .getRawOne();

    if (parseInt(laboratoryOrdersCount.count) > 0) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el paciente ${patient.firstName} ${
            patient.lastName
          } porque tiene ${laboratoryOrdersCount.count} orden${
            parseInt(laboratoryOrdersCount.count) > 1 ? 'es' : ''
          } de laboratorio asociada${
            parseInt(laboratoryOrdersCount.count) > 1 ? 's' : ''
          }. Primero elimine las órdenes de laboratorio.`,
          en: `Cannot delete patient ${patient.firstName} ${
            patient.lastName
          } because it has ${
            laboratoryOrdersCount.count
          } associated laboratory order${
            parseInt(laboratoryOrdersCount.count) > 1 ? 's' : ''
          }. Please delete the laboratory orders first.`,
        },
      });
    }

    const associatedClientsCount = await this.countAssociatedClients(
      id,
      branchId,
      companyId
    );

    if (associatedClientsCount > 0 && !deleteAssociatedClients) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el paciente ${patient.firstName} ${patient.lastName} porque tiene ${associatedClientsCount} cliente${
            associatedClientsCount > 1 ? 's' : ''
          } asociado${
            associatedClientsCount > 1 ? 's' : ''
          }. Confirme si desea eliminar también los clientes asociados.`,
          en: `Cannot delete patient ${patient.firstName} ${patient.lastName} because it has ${associatedClientsCount} associated client${
            associatedClientsCount > 1 ? 's' : ''
          }. Confirm if you also want to delete associated clients.`,
        },
        data: {
          associatedClientsCount,
          requiresClientDeletionConfirmation: true,
        },
      });
    }

    let deletedClientsCount = 0;

    if (associatedClientsCount > 0 && deleteAssociatedClients) {
      deletedClientsCount = await this.deleteAssociatedClients(
        id,
        branchId,
        companyId
      );
    }

    await this.patientRepository.remove(patient);

    return {
      messageKey: 'PATIENT.DELETED',
      message: {
        es: 'Paciente eliminado correctamente',
        en: 'Patient deleted successfully',
      },
      data: {
        id,
        deletedClientsCount,
      },
    };
  }

  async searchPatients(
    query: string,
    branchId: string,
    companyId: string | null
  ) {
    if (!query || query.trim().length < 2) {
      return {
        messageKey: 'PATIENT.SEARCH_QUERY_TOO_SHORT',
        data: [],
      };
    }

    const queryBuilder = this.patientRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.branch', 'branch')
      .leftJoinAndSelect('patient.company', 'company')
      .select([
        'patient.id',
        'patient.firstName',
        'patient.lastName',
        'patient.email',
        'patient.documentNumber',
        'patient.mobilePhone',
        'patient.profilePhoto',
        'patient.branchId',
        'branch.id',
        'branch.name',
        'branch.code',
        'company.id',
        'company.name',
      ])
      .where('patient.isActive = :isActive', { isActive: true })
      .andWhere(
        '(patient.firstName ILIKE :query OR patient.lastName ILIKE :query OR patient.email ILIKE :query OR patient.documentNumber ILIKE :query)',
        { query: `%${query.trim()}%` }
      );

    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'patient', companyId);
    queryBuilder.andWhere('patient.branchId = :branchId', { branchId });

    const patients = await queryBuilder
      .orderBy('patient.firstName', 'ASC')
      .limit(20)
      .getMany();

    return {
      messageKey: 'PATIENT.SEARCH_RESULTS',
      data: patients,
    };
  }

  async uploadProfilePhoto(
    patientId: string,
    file: Express.Multer.File,
    branchId: string,
    companyId: string | null
  ): Promise<any> {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id: patientId, branchId },
      companyId
    );

    const patient = await this.patientRepository.findOne({
      where: whereCondition,
    });

    if (!patient) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Paciente no encontrado',
          en: 'Patient not found',
        },
      });
    }

    try {
      const uploadResult = await this.filesService.uploadFile(file, {
        entityType: 'patient',
        entityId: patientId,
        fileCategory: 'profile_photo',
      });

      if (uploadResult.data && uploadResult.data.url) {
        await this.patientRepository.update(patientId, {
          profilePhoto: uploadResult.data.url,
        });

        const updatedPatient = await this.patientRepository.findOne({
          where: whereCondition,
        });

        return {
          messageKey: 'PATIENT.PROFILE_PHOTO_UPDATED',
          data: updatedPatient,
        };
      }
    } catch (error) {
      throw error;
    }
  }
}
