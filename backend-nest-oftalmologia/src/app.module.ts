import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Configuration
import { validate } from './config/env.validation';

// Common
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestActivityInterceptor } from './common/interceptors/request-activity.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CommonModule } from './common/common.module';
import { BranchFilterMiddleware } from './common/middleware/branch-filter.middleware';
import { AuthRoleMiddleware } from './common/middleware/auth-role.middleware';
import { CompanyFilterMiddleware } from './common/middleware/company-filter.middleware';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesPermissionsModule } from './modules/roles-permissions/roles-permissions.module';
import { FilesModule } from './modules/files/files.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SubcategoriesModule } from './modules/subcategories/subcategories.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { ProductsModule } from './modules/products/products.module';
import { ShiftManagementModule } from './modules/shift-management/shift-management.module';
import { ClinicalFormConfigModule } from './modules/clinical-form-config/clinical-form-config.module';
import { ClinicalHistoriesModule } from './modules/clinical-histories/clinical-histories.module';
import { LaboratoryOrdersModule } from './modules/laboratory-orders/laboratory-orders.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PatientsModule } from './modules/patients/patients.module';
import { CompanyQuotaModule } from './modules/company-quota/company-quota.module';
import { FeedbackModule } from './modules/feedback/feedback.module';

// Entities
import { User } from './modules/users/entities/user.entity';
import { Role } from './modules/roles-permissions/entities/role.entity';
import { Module as ModuleEntity } from './modules/roles-permissions/entities/module.entity';
import { Permission } from './modules/roles-permissions/entities/permission.entity';
import { RolePermission } from './modules/roles-permissions/entities/role-permission.entity';
import { RoleModule } from './modules/roles-permissions/entities/role-module.entity';
import { File } from './modules/files/entities/file.entity';
import { Company } from './modules/companies/entities/company.entity';
import { Branch } from './modules/branches/entities/branch.entity';
import { Category } from './modules/categories/entities/category.entity';
import { Subcategory } from './modules/subcategories/entities/subcategory.entity';
import { Supplier } from './modules/suppliers/entities/supplier.entity';
import { Product } from './modules/products/entities/product.entity';
import { InventoryTransfer } from './modules/products/entities/inventory-transfer.entity';
import { StockMovement } from './modules/products/entities/stock-movement.entity';
import { ProductDiscount } from './modules/products/entities/product-discount.entity';
import { Shift } from './modules/shift-management/entities/shift.entity';
import { ShiftStatus } from './modules/shift-management/entities/shift-status.entity';
import { ClinicalFormConfig } from './modules/clinical-form-config/entities/clinical-form-config.entity';
import { ClinicalHistory } from './modules/clinical-histories/entities/clinical-history.entity';
import { LaboratoryOrder } from './modules/laboratory-orders/entities/laboratory-order.entity';
import { Patient } from './modules/patients/entities/patient.entity';
import { Feedback } from './modules/feedback/entities/feedback.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [
          User,
          Role,
          ModuleEntity,
          Permission,
          RolePermission,
          RoleModule,
          File,
          Company,
          Branch,
          Category,
          Subcategory,
          Supplier,
          Product,
          InventoryTransfer,
          StockMovement,
          ProductDiscount,
          Shift,
          ShiftStatus,
          ClinicalFormConfig,
          ClinicalHistory,
          LaboratoryOrder,
          Patient,
          Feedback,
        ],
        synchronize: false,
        dropSchema: false,
        logging: ['error'],
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    CommonModule,
    AuthModule,
    UsersModule,
    RolesPermissionsModule,
    FilesModule,
    CompaniesModule,
    BranchesModule,
    CategoriesModule,
    SubcategoriesModule,
    SuppliersModule,
    ProductsModule,
    ShiftManagementModule,
    ClinicalFormConfigModule,
    ClinicalHistoriesModule,
    LaboratoryOrdersModule,
    DashboardModule,
    PatientsModule,
    CompanyQuotaModule,
    FeedbackModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestActivityInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        AuthRoleMiddleware,
        CompanyFilterMiddleware,
        BranchFilterMiddleware
      )
      .forRoutes('*');
  }
}
