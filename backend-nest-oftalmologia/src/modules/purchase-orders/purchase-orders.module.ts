import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { Client } from '../patients/entities/client.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrder, Client, LaboratoryOrder])],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
