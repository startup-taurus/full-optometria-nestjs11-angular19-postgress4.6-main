import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LaboratoryOrdersService } from './laboratory-orders.service';
import { LaboratoryOrdersController } from './laboratory-orders.controller';
import { LaboratoryOrder } from './entities/laboratory-order.entity';
import { ClinicalHistory } from '../clinical-histories/entities/clinical-history.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../products/entities/stock-movement.entity';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LaboratoryOrder,
      ClinicalHistory,
      Product,
      StockMovement,
    ]),
    forwardRef(() => PurchaseOrdersModule),
  ],
  controllers: [LaboratoryOrdersController],
  providers: [LaboratoryOrdersService],
  exports: [LaboratoryOrdersService],
})
export class LaboratoryOrdersModule {}
