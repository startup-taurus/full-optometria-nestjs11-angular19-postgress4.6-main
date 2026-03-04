import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';

export interface QuotaUsage {
  current: number;
  max: number | null;
  allowed: boolean;
}

@Injectable()
export class CompanyQuotaService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>
  ) {}

  async checkUserQuota(companyId: string): Promise<void> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      select: ['id', 'maxUsers'],
    });

    if (!company) return;
    if (company.maxUsers === null || company.maxUsers === undefined) return;

    const currentCount = await this.userRepository.count({
      where: { companyId },
    });

    if (currentCount >= company.maxUsers) {
      throw new ForbiddenException({
        statusCode: 403,
        success: false,
        message: {
          es: `Límite de usuarios alcanzado. Su plan permite un máximo de ${company.maxUsers} usuario${company.maxUsers > 1 ? 's' : ''} y actualmente tiene ${currentCount}.`,
          en: `User limit reached. Your plan allows a maximum of ${company.maxUsers} user${company.maxUsers > 1 ? 's' : ''} and you currently have ${currentCount}.`,
        },
      });
    }
  }

  async checkBranchQuota(companyId: string): Promise<void> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      select: ['id', 'maxBranches'],
    });

    if (!company) return;
    if (company.maxBranches === null || company.maxBranches === undefined)
      return;

    const currentCount = await this.branchRepository.count({
      where: { companyId },
    });

    if (currentCount >= company.maxBranches) {
      throw new ForbiddenException({
        statusCode: 403,
        success: false,
        message: {
          es: `Límite de sucursales alcanzado. Su plan permite un máximo de ${company.maxBranches} sucursal${company.maxBranches > 1 ? 'es' : ''} y actualmente tiene ${currentCount}.`,
          en: `Branch limit reached. Your plan allows a maximum of ${company.maxBranches} branch${company.maxBranches > 1 ? 'es' : ''} and you currently have ${currentCount}.`,
        },
      });
    }
  }

  async getCompanyUsage(companyId: string): Promise<{
    usersCount: number;
    maxUsers: number | null;
    branchesCount: number;
    maxBranches: number | null;
  }> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      select: ['id', 'maxUsers', 'maxBranches'],
    });

    const [usersCount, branchesCount] = await Promise.all([
      this.userRepository.count({ where: { companyId } }),
      this.branchRepository.count({ where: { companyId } }),
    ]);

    return {
      usersCount,
      maxUsers: company?.maxUsers ?? null,
      branchesCount,
      maxBranches: company?.maxBranches ?? null,
    };
  }
}
