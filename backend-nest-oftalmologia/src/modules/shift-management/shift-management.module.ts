import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { ShiftStatus } from './entities/shift-status.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Branch } from '../branches/entities/branch.entity';
import { ShiftsService } from './services/shifts.service';
import { ShiftStatusService } from './services/shift-status.service';
import { ShiftStatusSeedService } from './services/shift-status-seed.service';
import { ShiftsController } from './controllers/shifts.controller';
import { ShiftStatusController } from './controllers/shift-status.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Shift, ShiftStatus, Patient, Branch])],
  controllers: [ShiftsController, ShiftStatusController],
  providers: [ShiftsService, ShiftStatusService, ShiftStatusSeedService],
  exports: [ShiftsService, ShiftStatusService, TypeOrmModule],
})
export class ShiftManagementModule {}
