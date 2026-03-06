import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Subcategory } from '../subcategories/entities/subcategory.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { File } from '../files/entities/file.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { Company } from '../companies/entities/company.entity';
import { InventoryTransfer } from './entities/inventory-transfer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      Subcategory,
      Supplier,
      File,
      LaboratoryOrder,
      Company,
      InventoryTransfer,
    ]),
    MulterModule.register({
      limits: {
        fileSize: 8 * 1024 * 1024,
      },
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
