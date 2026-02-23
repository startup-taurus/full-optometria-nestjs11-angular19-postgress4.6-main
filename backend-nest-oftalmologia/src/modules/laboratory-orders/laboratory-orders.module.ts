import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LaboratoryOrdersService } from './laboratory-orders.service';
import { LaboratoryOrdersController } from './laboratory-orders.controller';
import { LaboratoryOrder } from './entities/laboratory-order.entity';
import { ClinicalHistory } from '../clinical-histories/entities/clinical-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LaboratoryOrder, ClinicalHistory])],
  controllers: [LaboratoryOrdersController],
  providers: [LaboratoryOrdersService],
  exports: [LaboratoryOrdersService],
})
export class LaboratoryOrdersModule {}
