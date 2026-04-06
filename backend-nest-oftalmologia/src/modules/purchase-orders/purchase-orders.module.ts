import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { Client } from '../patients/entities/client.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderItem, Client, LaboratoryOrder, Product])],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
