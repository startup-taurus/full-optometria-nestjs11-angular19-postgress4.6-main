import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftStatus } from '../entities/shift-status.entity';

@Injectable()
export class ShiftStatusSeedService {
  constructor(
    @InjectRepository(ShiftStatus)
    private shiftStatusRepository: Repository<ShiftStatus>
  ) {}

 
}
