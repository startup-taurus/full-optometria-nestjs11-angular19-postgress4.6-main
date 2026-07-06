import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { CompaniesModule } from '../companies/companies.module';
import { Company } from '../companies/entities/company.entity';
import { Branch } from '../branches/entities/branch.entity';
import { User } from '../users/entities/user.entity';
import { Permission } from '../roles-permissions/entities/permission.entity';
import { RolePermission } from '../roles-permissions/entities/role-permission.entity';
import { Role } from '../roles-permissions/entities/role.entity';
import { FilesModule } from '../files/files.module';
import { Plan } from './entities/plan.entity';
import { CompanySubscription } from './entities/company-subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { LandingBillingClient } from './landing-billing.client';
import { ProvisioningController } from './controllers/provisioning.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { AdminSubscriptionsController } from './controllers/admin-subscriptions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      CompanySubscription,
      Company,
      Branch,
      User,
      Permission,
      RolePermission,
      Role,
    ]),
    CompaniesModule,
    FilesModule,
    MulterModule.register({
      limits: {
        fileSize: 8 * 1024 * 1024,
      },
    }),
  ],
  controllers: [
    ProvisioningController,
    SubscriptionsController,
    AdminSubscriptionsController,
  ],
  providers: [
    SubscriptionsService,
    AdminSubscriptionsService,
    LandingBillingClient,
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
