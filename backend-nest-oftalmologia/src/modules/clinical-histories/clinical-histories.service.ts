import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ClinicalHistory } from './entities/clinical-history.entity';
import { CreateClinicalHistoryDto } from './dtos/create-clinical-history.dto';
import { UpdateClinicalHistoryDto } from './dtos/update-clinical-history.dto';
import { QueryClinicalHistoryDto } from './dtos/query-clinical-history.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { CompanyFilterUtil } from '../../common/utils/company-filter.util';
import { Shift } from '../shift-management/entities/shift.entity';
import { ShiftStatus } from '../shift-management/entities/shift-status.entity';

@Injectable()
export class ClinicalHistoriesService {
  private readonly logger = new Logger(ClinicalHistoriesService.name);

  constructor(
    @InjectRepository(ClinicalHistory)
    private clinicalHistoryRepository: Repository<ClinicalHistory>,
    @InjectRepository(Shift)
    private shiftRepository: Repository<Shift>,
    @InjectRepository(ShiftStatus)
    private shiftStatusRepository: Repository<ShiftStatus>
  ) {}

  async create(
    createDto: CreateClinicalHistoryDto,
    branchId: string,
    companyId?: string
  ) {
    const { fromShiftFlow, sourceShiftId, ...clinicalHistoryPayload } =
      createDto;

    const clinicalHistory = this.clinicalHistoryRepository.create({
      ...clinicalHistoryPayload,
      branchId,
      companyId,
    });

    const savedHistory = await this.clinicalHistoryRepository.save(
      clinicalHistory
    );

    if (fromShiftFlow && sourceShiftId) {
      try {
        await this.finalizeShiftFromClinicalFlow(sourceShiftId, branchId, companyId);
      } catch (error: any) {
        this.logger.warn(
          `Clinical history ${savedHistory.id} created but shift ${sourceShiftId} was not finalized: ${
            error?.message || 'unknown error'
          }`
        );
      }
    }

    return this.formatResponse(savedHistory);
  }

  private async finalizeShiftFromClinicalFlow(
    shiftId: string,
    branchId: string,
    companyId?: string
  ): Promise<void> {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id: shiftId, branchId },
      companyId
    );

    const shift = await this.shiftRepository.findOne({
      where: whereCondition,
    });

    if (!shift) {
      throw new NotFoundException('Shift not found for auto-finalization');
    }

    const finalizadoStatus = await this.shiftStatusRepository
      .createQueryBuilder('status')
      .where('LOWER(BTRIM(status.name)) = LOWER(:statusName)', {
        statusName: 'Finalizado',
      })
      .andWhere('status.isActive = :isActive', { isActive: true })
      .getOne();

    if (!finalizadoStatus) {
      throw new NotFoundException('Finalizado status not found or inactive');
    }

    if (shift.statusId === finalizadoStatus.id) {
      return;
    }

    shift.statusId = finalizadoStatus.id;
    await this.shiftRepository.save(shift);
  }

  async findAll(
    queryDto: QueryClinicalHistoryDto,
    branchId: string,
    companyId?: string
  ) {
    const {
      page,
      limit,
      patientFilterId,
      isSent,
      search,
      identification,
      firstName,
      lastName,
      phone,
      email,
      status,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = queryDto;

    const queryBuilder = this.clinicalHistoryRepository
      .createQueryBuilder('ch')
      .leftJoinAndSelect('ch.patient', 'patient')
      .where('ch.branchId = :branchId', { branchId });

    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'ch', companyId);

    if (patientFilterId) {
      queryBuilder.andWhere('ch.patientId = :patientFilterId', {
        patientFilterId,
      });
    }

    if (typeof isSent === 'boolean') {
      queryBuilder.andWhere('ch.isSent = :isSent', { isSent });
    }

    if (identification) {
      queryBuilder.andWhere('patient.documentNumber ILIKE :identification', {
        identification: `%${identification}%`,
      });
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

    if (phone) {
      queryBuilder.andWhere(
        '(patient.mobilePhone ILIKE :phone OR patient.homePhone ILIKE :phone)',
        { phone: `%${phone}%` }
      );
    }

    if (email) {
      queryBuilder.andWhere('patient.email ILIKE :email', {
        email: `%${email}%`,
      });
    }

    if (status) {
      const isSentValue =
        status === 'enviado' ? true : status === 'pendiente' ? false : null;
      if (isSentValue !== null) {
        queryBuilder.andWhere('ch.isSent = :statusFilter', {
          statusFilter: isSentValue,
        });
      }
    }

    if (dateFrom) {
      queryBuilder.andWhere('ch.lastVisualExamDate >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('ch.lastVisualExamDate <= :dateTo', { dateTo });
    }

    if (search) {
      queryBuilder.andWhere(
        '(patient.firstName ILIKE :search OR patient.lastName ILIKE :search OR patient.documentNumber ILIKE :search OR ch.professionalName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    queryBuilder.orderBy(`ch.${sortBy}`, sortOrder);

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return PaginationUtil.paginate(
      data.map((item) => this.formatResponse(item)),
      total,
      { page, limit }
    );
  }

  async findOne(id: string, branchId: string, companyId?: string) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );

    const clinicalHistory = await this.clinicalHistoryRepository.findOne({
      where: whereCondition,
      relations: ['patient'],
    });

    if (!clinicalHistory) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Clinical history not found',
      });
    }

    return this.formatResponse(clinicalHistory);
  }

  async findByPatient(patientId: string, branchId: string, companyId?: string) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { patientId: patientId, branchId },
      companyId
    );

    const clinicalHistories = await this.clinicalHistoryRepository.find({
      where: whereCondition,
      relations: ['patient'],
      order: { createdAt: 'DESC' },
    });

    return clinicalHistories.map((item) => this.formatResponse(item));
  }

  async update(
    id: string,
    updateDto: UpdateClinicalHistoryDto,
    branchId: string,
    companyId?: string
  ) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );

    const clinicalHistory = await this.clinicalHistoryRepository.findOne({
      where: whereCondition,
    });

    if (!clinicalHistory) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Clinical history not found',
      });
    }

    Object.assign(clinicalHistory, updateDto);
    const savedHistory = await this.clinicalHistoryRepository.save(
      clinicalHistory
    );

    return this.formatResponse(savedHistory);
  }

  async changeStatus(
    id: string,
    isSent: boolean,
    branchId: string,
    companyId?: string
  ) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );

    const clinicalHistory = await this.clinicalHistoryRepository.findOne({
      where: whereCondition,
    });

    if (!clinicalHistory) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Clinical history not found',
      });
    }

    clinicalHistory.isSent = isSent;
    const savedHistory = await this.clinicalHistoryRepository.save(
      clinicalHistory
    );

    return this.formatResponse(savedHistory);
  }

  async remove(id: string, branchId: string, companyId?: string) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );

    const clinicalHistory = await this.clinicalHistoryRepository.findOne({
      where: whereCondition,
      relations: ['patient'],
    });

    if (!clinicalHistory) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Clinical history not found',
      });
    }

    const laboratoryOrdersCount = await this.clinicalHistoryRepository
      .createQueryBuilder('history')
      .leftJoin(
        'laboratory_orders',
        'order',
        'order.clinical_history_id = history.id'
      )
      .where('history.id = :id', { id })
      .select('COUNT(order.id)', 'count')
      .getRawOne();

    if (parseInt(laboratoryOrdersCount.count) > 0) {
      const patientName = clinicalHistory.patient
        ? `${clinicalHistory.patient.firstName} ${clinicalHistory.patient.lastName}`
        : 'del paciente';

      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar la historia clínica ${patientName} porque tiene ${
            laboratoryOrdersCount.count
          } orden${
            parseInt(laboratoryOrdersCount.count) > 1 ? 'es' : ''
          } de laboratorio asociada${
            parseInt(laboratoryOrdersCount.count) > 1 ? 's' : ''
          }. Primero elimine las órdenes de laboratorio.`,
          en: `Cannot delete clinical history for ${patientName} because it has ${
            laboratoryOrdersCount.count
          } associated laboratory order${
            parseInt(laboratoryOrdersCount.count) > 1 ? 's' : ''
          }. Please delete the laboratory orders first.`,
        },
      });
    }

    await this.clinicalHistoryRepository.remove(clinicalHistory);

    return {
      messageKey: 'SUCCESS.DELETE',
      message: 'Clinical history deleted successfully',
    };
  }

  private formatResponse(clinicalHistory: ClinicalHistory) {
    return {
      id: clinicalHistory.id,
      branchId: clinicalHistory.branchId,
      patientId: clinicalHistory.patientId,
      patient: clinicalHistory.patient
        ? {
            id: clinicalHistory.patient.id,
            firstName: clinicalHistory.patient.firstName,
            lastName: clinicalHistory.patient.lastName,
            documentNumber: clinicalHistory.patient.documentNumber,
            email: clinicalHistory.patient.email,
            mobilePhone: clinicalHistory.patient.mobilePhone,
          }
        : null,
      professionalName: clinicalHistory.professionalName,
      occupation: clinicalHistory.occupation,
      firstTime: clinicalHistory.firstTime,
      isSent: clinicalHistory.isSent,
      lastVisualExamDate: clinicalHistory.lastVisualExamDate,
      visionProblems: clinicalHistory.visionProblems,
      generalHealth: clinicalHistory.generalHealth,
      otherHealthProblems: clinicalHistory.otherHealthProblems,
      segmentAnterior: clinicalHistory.segmentAnterior,
      segmentAnteriorOther: clinicalHistory.segmentAnteriorOther,
      previousRxOd: clinicalHistory.previousRxOd,
      previousAddOd: clinicalHistory.previousAddOd,
      previousRxOi: clinicalHistory.previousRxOi,
      previousAddOi: clinicalHistory.previousAddOi,
      visualAcuityOdVl: clinicalHistory.visualAcuityOdVl,
      visualAcuityOdVp: clinicalHistory.visualAcuityOdVp,
      visualAcuityOiVl: clinicalHistory.visualAcuityOiVl,
      visualAcuityOiVp: clinicalHistory.visualAcuityOiVp,
      motorTest: clinicalHistory.motorTest,
      finalRxOdSphere: clinicalHistory.finalRxOdSphere,
      finalRxOdCylinder: clinicalHistory.finalRxOdCylinder,
      finalRxOdAxis: clinicalHistory.finalRxOdAxis,
      finalRxOdAdd: clinicalHistory.finalRxOdAdd,
      finalRxOiSphere: clinicalHistory.finalRxOiSphere,
      finalRxOiCylinder: clinicalHistory.finalRxOiCylinder,
      finalRxOiAxis: clinicalHistory.finalRxOiAxis,
      finalRxOiAdd: clinicalHistory.finalRxOiAdd,
      correctedAvOdVl: clinicalHistory.correctedAvOdVl,
      correctedAvOdVp: clinicalHistory.correctedAvOdVp,
      correctedAvOiVl: clinicalHistory.correctedAvOiVl,
      correctedAvOiVp: clinicalHistory.correctedAvOiVp,
      lensTypes: clinicalHistory.lensTypes,
      additionalTreatments: clinicalHistory.additionalTreatments,
      pupillaryReflexes: clinicalHistory.pupillaryReflexes,
      ophthalmoscopyOd: clinicalHistory.ophthalmoscopyOd,
      ophthalmoscopyOi: clinicalHistory.ophthalmoscopyOi,
      refractiveTests: clinicalHistory.refractiveTests,
      stereopsis: clinicalHistory.stereopsis,
      worthTest: clinicalHistory.worthTest,
      otherNotes: clinicalHistory.otherNotes,
      diagnosis: clinicalHistory.diagnosis,
      disposition: clinicalHistory.disposition,
      createdAt: clinicalHistory.createdAt,
      updatedAt: clinicalHistory.updatedAt,
    };
  }
}
