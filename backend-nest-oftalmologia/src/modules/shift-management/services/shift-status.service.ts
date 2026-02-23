import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftStatus } from '../entities/shift-status.entity';
import { CreateShiftStatusDto } from '../dtos/create-shift-status.dto';
import { UpdateShiftStatusDto } from '../dtos/update-shift-status.dto';

@Injectable()
export class ShiftStatusService {
  constructor(
    @InjectRepository(ShiftStatus)
    private shiftStatusRepository: Repository<ShiftStatus>
  ) {}

  async create(createShiftStatusDto: CreateShiftStatusDto) {
    const existingStatus = await this.shiftStatusRepository.findOne({
      where: { name: createShiftStatusDto.name },
    });

    if (existingStatus) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: 'Status name already exists',
      });
    }

    const shiftStatus = this.shiftStatusRepository.create(createShiftStatusDto);
    const savedStatus = await this.shiftStatusRepository.save(shiftStatus);

    return {
      messageKey: 'SHIFT_STATUS.CREATED',
      data: savedStatus,
    };
  }

  async findAll() {
    const statuses = await this.shiftStatusRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return {
      messageKey: 'SHIFT_STATUS.FOUND',
      data: statuses,
    };
  }

  async findOne(id: string) {
    const status = await this.shiftStatusRepository.findOne({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    return {
      messageKey: 'SHIFT_STATUS.FETCHED',
      data: status,
    };
  }

  async update(id: string, updateShiftStatusDto: UpdateShiftStatusDto) {
    const status = await this.shiftStatusRepository.findOne({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    if (
      updateShiftStatusDto.name &&
      updateShiftStatusDto.name !== status.name
    ) {
      const existingStatus = await this.shiftStatusRepository.findOne({
        where: { name: updateShiftStatusDto.name },
      });

      if (existingStatus) {
        throw new ConflictException({
          messageKey: 'ERROR.VALIDATION',
          message: 'Status name already exists',
        });
      }
    }

    Object.assign(status, updateShiftStatusDto);
    const updatedStatus = await this.shiftStatusRepository.save(status);

    return {
      messageKey: 'SHIFT_STATUS.UPDATED',
      data: updatedStatus,
    };
  }

  async remove(id: string) {
    const status = await this.shiftStatusRepository.findOne({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
      });
    }

    const shiftsCount = await this.shiftStatusRepository
      .createQueryBuilder('status')
      .leftJoin('shifts', 'shift', 'shift.status_id = status.id')
      .where('status.id = :id', { id })
      .select('COUNT(shift.id)', 'count')
      .getRawOne();

    if (parseInt(shiftsCount.count) > 0) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: `No se puede eliminar el estado ${status.name} porque tiene ${
            shiftsCount.count
          } turno${parseInt(shiftsCount.count) > 1 ? 's' : ''} asociado${
            parseInt(shiftsCount.count) > 1 ? 's' : ''
          }. Primero cambie el estado de los turnos o elimínelos.`,
          en: `Cannot delete status ${status.name} because it has ${
            shiftsCount.count
          } associated shift${
            parseInt(shiftsCount.count) > 1 ? 's' : ''
          }. Please change the shift status or delete the shifts first.`,
        },
      });
    }

    await this.shiftStatusRepository.remove(status);

    return {
      messageKey: 'SHIFT_STATUS.DELETED',
      data: { id },
    };
  }
}
