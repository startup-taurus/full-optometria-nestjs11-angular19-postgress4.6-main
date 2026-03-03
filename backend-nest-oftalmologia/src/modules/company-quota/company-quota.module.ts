import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyQuotaService } from './company-quota.service';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User, Branch])],
  providers: [CompanyQuotaService],
  exports: [CompanyQuotaService],
})
export class CompanyQuotaModule {}
