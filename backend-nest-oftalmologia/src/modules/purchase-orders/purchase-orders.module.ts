import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrderInvoice } from './entities/purchase-order-invoice.entity';
import { PurchaseOrderInvoiceLog } from './entities/purchase-order-invoice-log.entity';
import { BillingPaymentMethod } from './entities/billing-payment-method.entity';
import { Client } from '../patients/entities/client.entity';
import { Branch } from '../branches/entities/branch.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { Product } from '../products/entities/product.entity';
import { Company } from '../companies/entities/company.entity';
import { PurchaseOrderBillingService } from './purchase-order-billing.service';
import { BillingApiProvider } from './providers/billing-api.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderItem,
      PurchaseOrderInvoice,
      PurchaseOrderInvoiceLog,
      BillingPaymentMethod,
      Client,
      Branch,
      LaboratoryOrder,
      Product,
      Company,
    ]),
  ],
  controllers: [PurchaseOrdersController],
  providers: [
    PurchaseOrdersService,
    PurchaseOrderBillingService,
    BillingApiProvider,
  ],
  exports: [PurchaseOrdersService, PurchaseOrderBillingService],
})
export class PurchaseOrdersModule {}
