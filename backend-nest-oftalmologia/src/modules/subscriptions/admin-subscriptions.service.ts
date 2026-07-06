import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { Company } from '../companies/entities/company.entity';
import { Plan } from './entities/plan.entity';
import { CompanySubscription } from './entities/company-subscription.entity';
import { ListSubscriptionsQueryDto } from './dtos/list-subscriptions.query.dto';
import {
  ManageSubscriptionDto,
  ReactivateSubscriptionDto,
} from './dtos/manage-subscription.dto';
import { LandingBillingClient } from './landing-billing.client';

const CANCELED_STATUSES = ['canceled', 'cancelled'];

@Injectable()
export class AdminSubscriptionsService {
  constructor(
    @InjectRepository(CompanySubscription)
    private readonly subscriptionRepository: Repository<CompanySubscription>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly landingBillingClient: LandingBillingClient
  ) {}

  async listAll(query: ListSubscriptionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { skip, take } = PaginationUtil.getSkipAndTake({ page, limit });

    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.logoFile', 'logoFile');

    if (query.search) {
      queryBuilder.andWhere(
        '(company.name ILIKE :search OR company.code ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.status === 'none') {
      queryBuilder.andWhere(
        'NOT EXISTS (SELECT 1 FROM company_subscriptions cs WHERE cs.company_id = company.id)'
      );
    } else if (query.status) {
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM company_subscriptions cs WHERE cs.company_id = company.id AND cs.status = :status)',
        { status: query.status }
      );
    }

    // Origen del cobro: landing (tiene external_subscription_id) vs manual (sin él).
    if (query.source === 'landing') {
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM company_subscriptions cs WHERE cs.company_id = company.id AND cs.external_subscription_id IS NOT NULL)'
      );
    } else if (query.source === 'manual') {
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM company_subscriptions cs WHERE cs.company_id = company.id AND cs.external_subscription_id IS NULL)'
      );
    }

    // Estado de la EMPRESA (activa/inactiva).
    if (query.active !== undefined) {
      queryBuilder.andWhere('company.isActive = :active', {
        active: query.active,
      });
    }

    const totalCount = await queryBuilder.getCount();

    const companies = await queryBuilder
      .orderBy('company.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    const companyIds = companies.map((company) => company.id);
    const subscriptions = companyIds.length
      ? await this.subscriptionRepository.find({
          where: { companyId: In(companyIds) },
          relations: ['plan'],
        })
      : [];

    const subscriptionByCompany = new Map(
      subscriptions.map((subscription) => [subscription.companyId, subscription])
    );

    const rows = companies.map((company) =>
      this.toRow(company, subscriptionByCompany.get(company.id) ?? null)
    );

    return {
      messageKey: 'SUCCESS',
      data: PaginationUtil.paginate(rows, totalCount, { page, limit }),
    };
  }

  async listPlans() {
    const plans = await this.planRepository.find({
      where: { isActive: true },
      order: { amountCents: 'ASC' },
    });

    return { messageKey: 'SUCCESS', data: plans };
  }

  async manage(companyId: string, dto: ManageSubscriptionDto) {
    const company = await this.requireCompany(companyId);
    let subscription = await this.subscriptionRepository.findOne({
      where: { companyId },
    });

    if (!subscription) {
      subscription = this.subscriptionRepository.create({
        companyId,
        status: 'active',
        startedAt: new Date(),
      });
    }

    if (dto.planCode !== undefined) {
      const plan = await this.planRepository.findOne({
        where: { code: dto.planCode },
      });
      if (!plan) {
        throw new BadRequestException({
          messageKey: 'ERROR.VALIDATION',
          message: 'Plan no encontrado',
        });
      }
      subscription.planId = plan.id;
      subscription.planCode = plan.code;
      subscription.amountCents = plan.amountCents;
      subscription.billingCycle = plan.billingCycle;
      subscription.currency = plan.currency;
    }

    if (dto.amountCents !== undefined) {
      subscription.amountCents = dto.amountCents;
    }
    if (dto.billingCycle !== undefined) {
      subscription.billingCycle = dto.billingCycle;
    }
    if (dto.currency !== undefined) {
      subscription.currency = dto.currency;
    }
    if (dto.currentPeriodEnd !== undefined) {
      subscription.currentPeriodEnd = new Date(dto.currentPeriodEnd);
    }

    let billingNotified: boolean | null = null;
    if (dto.status !== undefined) {
      subscription.status = dto.status;
      if (CANCELED_STATUSES.includes(dto.status)) {
        subscription.canceledAt = new Date();
        billingNotified = await this.notifyLandingCancel(subscription);
      } else {
        subscription.canceledAt = null;
      }
    }

    const saved = await this.subscriptionRepository.save(subscription);
    return {
      messageKey: 'SUCCESS',
      data: { ...this.toRow(company, await this.withPlan(saved)), billingNotified },
    };
  }

  async cancel(companyId: string) {
    const company = await this.requireCompany(companyId);
    const subscription = await this.subscriptionRepository.findOne({
      where: { companyId },
    });

    if (!subscription) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'La empresa no tiene una suscripcion',
      });
    }

    subscription.status = 'canceled';
    subscription.canceledAt = new Date();
    const billingNotified = await this.notifyLandingCancel(subscription);
    const saved = await this.subscriptionRepository.save(subscription);

    return {
      messageKey: 'SUCCESS',
      data: { ...this.toRow(company, await this.withPlan(saved)), billingNotified },
    };
  }

  async reactivate(companyId: string, dto: ReactivateSubscriptionDto) {
    const company = await this.requireCompany(companyId);
    const subscription = await this.subscriptionRepository.findOne({
      where: { companyId },
    });

    if (!subscription) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'La empresa no tiene una suscripcion',
      });
    }

    subscription.status = 'active';
    subscription.canceledAt = null;
    if (dto.currentPeriodEnd !== undefined) {
      subscription.currentPeriodEnd = new Date(dto.currentPeriodEnd);
    }

    const saved = await this.subscriptionRepository.save(subscription);
    return {
      messageKey: 'SUCCESS',
      data: this.toRow(company, await this.withPlan(saved)),
    };
  }

  // Activa/desactiva la EMPRESA. Es una acción DISTINTA a cancelar la suscripción:
  // no toca el cobro. Al desactivarla, el login queda bloqueado para todos sus
  // usuarios (ver AuthService.login). La suscripción se devuelve intacta.
  async setCompanyActive(companyId: string, isActive: boolean) {
    const company = await this.requireCompany(companyId);
    if (company.isActive !== isActive) {
      company.isActive = isActive;
      await this.companyRepository.save(company);
    }
    const subscription = await this.subscriptionRepository.findOne({
      where: { companyId },
      relations: ['plan'],
    });
    return {
      messageKey: 'SUCCESS',
      data: this.toRow(company, subscription ?? null),
    };
  }

  private async requireCompany(companyId: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['logoFile'],
    });

    if (!company) {
      throw new NotFoundException({ messageKey: 'ERROR.NOT_FOUND' });
    }

    return company;
  }

  private async withPlan(
    subscription: CompanySubscription
  ): Promise<CompanySubscription> {
    if (!subscription.planId) {
      subscription.plan = null as unknown as Plan;
      return subscription;
    }
    const plan = await this.planRepository.findOne({
      where: { id: subscription.planId },
    });
    subscription.plan = plan as Plan;
    return subscription;
  }

  private async notifyLandingCancel(
    subscription: CompanySubscription
  ): Promise<boolean | null> {
    if (!subscription.externalSubscriptionId) {
      return null;
    }
    return this.landingBillingClient.cancelRemote(
      subscription.externalSubscriptionId
    );
  }

  private toRow(company: Company, subscription: CompanySubscription | null) {
    return {
      company: {
        id: company.id,
        name: company.name,
        code: company.code,
        email: company.email ?? null,
        phone: company.phone ?? null,
        isActive: company.isActive,
        logoFile: company.logoFile ?? null,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            planId: subscription.planId,
            planCode: subscription.planCode,
            planName: subscription.plan?.name ?? null,
            amountCents: subscription.amountCents,
            currency: subscription.currency,
            billingCycle: subscription.billingCycle,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cardBrand: subscription.cardBrand,
            cardLast4: subscription.cardLast4,
            externalSubscriptionId: subscription.externalSubscriptionId,
            source: subscription.externalSubscriptionId ? 'landing' : 'manual',
            startedAt: subscription.startedAt,
            canceledAt: subscription.canceledAt,
            lastSyncedAt: subscription.lastSyncedAt,
          }
        : null,
    };
  }
}
