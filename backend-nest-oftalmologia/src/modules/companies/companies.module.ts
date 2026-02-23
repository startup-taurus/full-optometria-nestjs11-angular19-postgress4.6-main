import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity';
import { File } from '../files/entities/file.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permissions/entities/role.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Subcategory } from '../subcategories/entities/subcategory.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Shift } from '../shift-management/entities/shift.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { ClinicalHistory } from '../clinical-histories/entities/clinical-history.entity';
import { ClinicalFormConfig } from '../clinical-form-config/entities/clinical-form-config.entity';
import { BranchesModule } from '../branches/branches.module';
import { RolesPermissionsModule } from '../roles-permissions/roles-permissions.module';
import { UsersModule } from '../users/users.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      File,
      User,
      Role,
      Product,
      Category,
      Subcategory,
      Supplier,
      Shift,
      LaboratoryOrder,
      ClinicalHistory,
      ClinicalFormConfig,
    ]),
    BranchesModule,
    RolesPermissionsModule,
    UsersModule,
    MulterModule.register({
      limits: {
        fileSize: 8 * 1024 * 1024,
      },
    }),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [TypeOrmModule, CompaniesService],
})
export class CompaniesModule {}
