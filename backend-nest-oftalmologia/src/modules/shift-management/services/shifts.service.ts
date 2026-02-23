import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Shift } from '../entities/shift.entity';
import { ShiftStatus } from '../entities/shift-status.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { CreateShiftDto } from '../dtos/create-shift.dto';
import { UpdateShiftDto } from '../dtos/update-shift.dto';
import { QueryShiftDto } from '../dtos/query-shift.dto';
import { PaginationUtil } from '../../../common/utils/pagination.util';
import { CompanyFilterUtil } from '../../../common/utils/company-filter.util';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private shiftRepository: Repository<Shift>,
    @InjectRepository(ShiftStatus)
    private shiftStatusRepository: Repository<ShiftStatus>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>
  ) {}

  async create(
    createShiftDto: CreateShiftDto,
    branchId: string,
    companyId?: string
  ) {
    const { patientId, appointmentDate } = createShiftDto;

    await this.validatePatient(patientId);
    await this.validateBranch(branchId);

    const appointmentDateTime = new Date(appointmentDate);
    await this.validateAppointmentDate(appointmentDateTime);
    await this.checkDuplicateAppointment(patientId, appointmentDateTime);

    const pendingStatus = await this.getDefaultStatus();

    const shift = this.shiftRepository.create({
      ...createShiftDto,
      branchId,
      companyId,
      appointmentDate: appointmentDateTime,
      statusId: pendingStatus.id,
    });

    const savedShift = await this.shiftRepository.save(shift);

    return {
      messageKey: 'SHIFT.CREATED',
      data: savedShift,
    };
  }

  async findAll(queryDto: QueryShiftDto, branchId: string, companyId?: string) {
    const {
      page,
      limit,
      patientName,
      patientId,
      phone,
      email,
      patientFilterId,
      statusId,
      dateFrom,
      dateTo,
    } = queryDto;

    const { skip, take } = PaginationUtil.getSkipAndTake({ page, limit });

    const queryBuilder = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.patient', 'patient')
      .leftJoinAndSelect('shift.status', 'status')
      .leftJoinAndSelect('shift.branch', 'branch')
      .select([
        'shift.id',
        'shift.appointmentDate',
        'shift.description',
        'shift.notes',
        'shift.createdAt',
        'shift.updatedAt',
        'patient.id',
        'patient.firstName',
        'patient.lastName',
        'patient.email',
        'patient.documentNumber',
        'patient.mobilePhone',
        'patient.profilePhoto',
        'status.id',
        'status.name',
        'status.description',
        'status.color',
        'branch.id',
        'branch.name',
      ])
      .where('shift.branchId = :branchId', { branchId });

    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'shift', companyId);

    if (patientName) {
      queryBuilder.andWhere(
        '(patient.firstName ILIKE :patientName OR patient.lastName ILIKE :patientName)',
        { patientName: `%${patientName}%` }
      );
    }

    if (patientId) {
      queryBuilder.andWhere('patient.documentNumber ILIKE :patientId', {
        patientId: `%${patientId}%`,
      });
    }

    if (phone) {
      queryBuilder.andWhere('patient.mobilePhone ILIKE :phone', {
        phone: `%${phone}%`,
      });
    }

    if (email) {
      queryBuilder.andWhere('patient.email ILIKE :email', {
        email: `%${email}%`,
      });
    }

    if (patientFilterId) {
      queryBuilder.andWhere('shift.patientId = :patientFilterId', {
        patientFilterId,
      });
    }

    if (statusId) {
      queryBuilder.andWhere('shift.statusId = :statusId', { statusId });
    }

    if (dateFrom && dateTo) {
      let dateToDate: string;
      if (dateTo.includes('T')) {
        dateToDate = dateTo.split('T')[0];
      } else {
        dateToDate = dateTo;
      }
      const dateToEndOfDay = new Date(dateToDate + 'T23:59:59.999Z');

      let dateFromFormatted: string;
      if (dateFrom.includes('T')) {
        dateFromFormatted = dateFrom;
      } else {
        dateFromFormatted = dateFrom + 'T00:00:00.000Z';
      }

      queryBuilder.andWhere(
        'shift.appointmentDate BETWEEN :dateFrom AND :dateTo',
        { dateFrom: dateFromFormatted, dateTo: dateToEndOfDay.toISOString() }
      );
    } else if (dateFrom) {
      let dateFromFormatted: string;
      if (dateFrom.includes('T')) {
        dateFromFormatted = dateFrom;
      } else {
        dateFromFormatted = dateFrom + 'T00:00:00.000Z';
      }
      queryBuilder.andWhere('shift.appointmentDate >= :dateFrom', {
        dateFrom: dateFromFormatted,
      });
    } else if (dateTo) {
      let dateToDate: string;
      if (dateTo.includes('T')) {
        dateToDate = dateTo.split('T')[0];
      } else {
        dateToDate = dateTo;
      }
      const dateToEndOfDay = new Date(dateToDate + 'T23:59:59.999Z');

      queryBuilder.andWhere('shift.appointmentDate <= :dateTo', {
        dateTo: dateToEndOfDay.toISOString(),
      });
    }

    queryBuilder.orderBy('shift.createdAt', 'DESC').skip(skip).take(take);

    const [shifts, total] = await queryBuilder.getManyAndCount();

    const paginatedResult = PaginationUtil.paginate(shifts, total, {
      page,
      limit,
    });

    return {
      messageKey: 'SHIFT.FOUND',
      data: paginatedResult,
    };
  }

  async findOne(id: string, branchId: string, companyId?: string) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );

    const shift = await this.shiftRepository.findOne({
      where: whereCondition,
      relations: ['patient', 'status', 'branch'],
      select: {
        id: true,
        appointmentDate: true,
        description: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        patient: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          documentNumber: true,
          mobilePhone: true,
          profilePhoto: true,
        },
        status: {
          id: true,
          name: true,
          description: true,
          color: true,
        },
        branch: {
          id: true,
          name: true,
        },
      },
    });

    if (!shift) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    return {
      messageKey: 'SHIFT.FETCHED',
      data: shift,
    };
  }

  async update(
    id: string,
    updateShiftDto: UpdateShiftDto,
    branchId: string,
    companyId?: string
  ) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );

    const shift = await this.shiftRepository.findOne({
      where: whereCondition,
    });

    if (!shift) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    if (updateShiftDto.appointmentDate) {
      const appointmentDateTime = new Date(updateShiftDto.appointmentDate);
      await this.validateAppointmentDate(appointmentDateTime);

      if (appointmentDateTime.getTime() !== shift.appointmentDate.getTime()) {
        await this.checkDuplicateAppointment(
          shift.patientId,
          appointmentDateTime,
          id
        );
      }

      updateShiftDto.appointmentDate = appointmentDateTime.toISOString();
    }

    if (updateShiftDto.statusId) {
      await this.validateStatus(updateShiftDto.statusId);
    }

    Object.assign(shift, updateShiftDto);
    const updatedShift = await this.shiftRepository.save(shift);

    return {
      messageKey: 'SHIFT.UPDATED',
      data: updatedShift,
    };
  }

  async remove(id: string, branchId: string, companyId?: string) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );

    const shift = await this.shiftRepository.findOne({
      where: whereCondition,
    });

    if (!shift) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    await this.shiftRepository.remove(shift);

    return {
      messageKey: 'SHIFT.DELETED',
      data: { id },
    };
  }

  private async validatePatient(patientId: string) {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Patient not found or inactive',
      });
    }

    return patient;
  }

  private async validateBranch(branchId: string) {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId, isActive: true },
    });

    if (!branch) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Branch not found or inactive',
      });
    }

    return branch;
  }

  private async validateStatus(statusId: string) {
    const status = await this.shiftStatusRepository.findOne({
      where: { id: statusId, isActive: true },
    });

    if (!status) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Status not found or inactive',
      });
    }

    return status;
  }

  private async validateAppointmentDate(appointmentDate: Date) {
    const now = new Date();

    if (appointmentDate <= now) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: 'Appointment date must be in the future',
      });
    }
  }

  private async checkDuplicateAppointment(
    patientId: string,
    appointmentDate: Date,
    excludeShiftId?: string
  ) {
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const queryBuilder = this.shiftRepository
      .createQueryBuilder('shift')
      .where('shift.patientId = :patientId', { patientId })
      .andWhere('shift.appointmentDate BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      });

    if (excludeShiftId) {
      queryBuilder.andWhere('shift.id != :excludeShiftId', { excludeShiftId });
    }

    const existingShift = await queryBuilder.getOne();

    if (existingShift) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: 'Patient already has an appointment on this date',
      });
    }
  }

  private async getDefaultStatus() {
    // ID del estado predeterminado (Pendiente, recordar cambiar si no se migra la data de esta db thiss)
    const DEFAULT_STATUS_ID = '4d0671f6-97cf-40fd-8811-005f5fd4d03e';

    let defaultStatus = await this.shiftStatusRepository.findOne({
      where: { id: DEFAULT_STATUS_ID, isActive: true },
    });

    if (!defaultStatus) {
      defaultStatus = await this.shiftStatusRepository.findOne({
        where: { isActive: true },
        order: { createdAt: 'ASC' },
      });
    }

    if (!defaultStatus) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message:
          'No active status found. Please create at least one shift status.',
      });
    }

    return defaultStatus;
  }
}
