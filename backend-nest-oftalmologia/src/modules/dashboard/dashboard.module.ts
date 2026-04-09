import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Shift } from '../shift-management/entities/shift.entity';
import { ClinicalHistory } from '../clinical-histories/entities/clinical-history.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { PurchaseOrderItem } from '../purchase-orders/entities/purchase-order-item.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shift,
      ClinicalHistory,
      LaboratoryOrder,
      Product,
      User,
      Patient,
      PurchaseOrderItem,
      PurchaseOrder,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
