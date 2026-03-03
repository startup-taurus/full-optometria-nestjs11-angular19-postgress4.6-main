import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalHistoriesService } from './clinical-histories.service';
import { ClinicalHistoriesController } from './clinical-histories.controller';
import { ClinicalHistory } from './entities/clinical-history.entity';
import { Shift } from '../shift-management/entities/shift.entity';
import { ShiftStatus } from '../shift-management/entities/shift-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicalHistory, Shift, ShiftStatus])],
  controllers: [ClinicalHistoriesController],
  providers: [ClinicalHistoriesService],
  exports: [ClinicalHistoriesService],
})
export class ClinicalHistoriesModule {}
