import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { CompaniesService } from '../companies/companies.service';
import { Company } from '../companies/entities/company.entity';
import { Branch } from '../branches/entities/branch.entity';
import { User } from '../users/entities/user.entity';
import { Permission } from '../roles-permissions/entities/permission.entity';
import { RolePermission } from '../roles-permissions/entities/role-permission.entity';
import { Role } from '../roles-permissions/entities/role.entity';
import { FilesService } from '../files/files.service';
import { EmailUtil } from '../../common/utils/email.util';
import { Plan } from './entities/plan.entity';
import { CompanySubscription } from './entities/company-subscription.entity';
import { ProvisionSubscriptionDto } from './dtos/provision-subscription.dto';
import { SyncSubscriptionDto } from './dtos/sync-subscription.dto';
import { LandingBillingClient } from './landing-billing.client';

const CANCELED_STATUSES = ['canceled', 'cancelled'];

const SET_PASSWORD_TOKEN_TTL_MS = 72 * 60 * 60 * 1000;
const DEFAULT_PLAN_CODE = 'unico';
const SUBSCRIPTION_PERMISSION_NAMES = ['VIEW_SUBSCRIPTION'];

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(CompanySubscription)
    private readonly subscriptionRepository: Repository<CompanySubscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly filesService: FilesService,
    private readonly companiesService: CompaniesService,
    private readonly emailUtil: EmailUtil,
    private readonly landingBillingClient: LandingBillingClient
  ) {}

  async provisionFromPayment(dto: ProvisionSubscriptionDto) {
    const alreadyProvisioned = await this.subscriptionRepository.findOne({
      where: { externalSubscriptionId: dto.externalSubscriptionId },
    });

    if (alreadyProvisioned) {
      return {
        messageKey: 'SUBSCRIPTION.ALREADY_PROVISIONED',
        data: {
          status: 'already_provisioned',
          companyId: alreadyProvisioned.companyId,
          subscriptionId: alreadyProvisioned.id,
          loginUrl: this.emailUtil.buildLoginUrl(),
        },
      };
    }

    const plan = await this.resolvePlan(dto.planCode);
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.adminEmail },
    });

    if (existingUser?.companyId) {
      return this.linkExistingCompany(existingUser, plan, dto);
    }

    return this.provisionNewCompany(plan, dto);
  }

  async getCompanySubscription(
    companyId: string | null,
    branchId?: string | null
  ) {
    const effectiveCompanyId = await this.resolveEffectiveCompanyId(
      companyId,
      branchId
    );
    if (!effectiveCompanyId) {
      return { messageKey: 'SUCCESS', data: null };
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { companyId: effectiveCompanyId },
      relations: ['plan'],
    });

    return { messageKey: 'SUCCESS', data: subscription ?? null };
  }

  // La suscripción es de la EMPRESA, no de la sucursal. Por eso:
  // - Usuario normal (tiene companyId en su token): se usa SIEMPRE su empresa y se
  //   IGNORA la sucursal seleccionada. Aunque cambie de sucursal en el filtro, ve
  //   el mismo plan (todas sus sucursales pertenecen a la misma empresa).
  // - Superadmin (sin companyId): se resuelve la empresa a partir de la sucursal
  //   seleccionada, así ve la suscripción de la empresa dueña de esa sucursal.
  private async resolveEffectiveCompanyId(
    companyId: string | null,
    branchId?: string | null
  ): Promise<string | null> {
    if (companyId) {
      return companyId;
    }
    if (!branchId) {
      return null;
    }
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
      select: ['id', 'companyId'],
    });
    return branch?.companyId ?? null;
  }

  async syncFromLanding(dto: SyncSubscriptionDto) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { externalSubscriptionId: dto.externalSubscriptionId },
    });

    if (!subscription) {
      return {
        messageKey: 'SUCCESS',
        data: { status: 'not_found', updated: false },
      };
    }

    if (dto.status) {
      subscription.status = dto.status;
      if (CANCELED_STATUSES.includes(dto.status)) {
        subscription.canceledAt = new Date();
      }
    }
    if (dto.currentPeriodEnd) {
      subscription.currentPeriodEnd = new Date(dto.currentPeriodEnd);
    }
    if (dto.cardBrand !== undefined) {
      subscription.cardBrand = dto.cardBrand;
    }
    if (dto.cardLast4 !== undefined) {
      subscription.cardLast4 = dto.cardLast4;
    }
    if (dto.amountCents !== undefined) {
      subscription.amountCents = dto.amountCents;
    }
    subscription.lastSyncedAt = new Date();

    const saved = await this.subscriptionRepository.save(subscription);

    return {
      messageKey: 'SUCCESS',
      data: { status: saved.status, subscriptionId: saved.id },
    };
  }

  async updateOwnCompanyLogo(
    companyId: string | null,
    branchId: string | null,
    file: Express.Multer.File
  ) {
    const effectiveCompanyId = await this.resolveEffectiveCompanyId(
      companyId,
      branchId
    );
    if (!effectiveCompanyId) {
      throw new ForbiddenException({
        messageKey: 'ERROR.FORBIDDEN',
        message: 'Solo el administrador de una optica puede cambiar el logo',
      });
    }
    if (!file) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: 'Imagen requerida',
      });
    }

    const uploaded = await this.filesService.uploadFile(file, {
      entityType: 'company',
      entityId: effectiveCompanyId,
      fileCategory: 'company_logo',
    });

    await this.companyRepository.update(effectiveCompanyId, {
      logoFileId: uploaded.data.id,
    });

    const company = await this.companyRepository.findOne({
      where: { id: effectiveCompanyId },
      relations: ['logoFile'],
    });

    return { messageKey: 'SUCCESS', data: company };
  }

  async cancelOwnSubscription(
    companyId: string | null,
    branchId?: string | null
  ) {
    const effectiveCompanyId = await this.resolveEffectiveCompanyId(
      companyId,
      branchId
    );
    if (!effectiveCompanyId) {
      throw new ForbiddenException({
        messageKey: 'ERROR.FORBIDDEN',
        message: 'Solo el administrador de una optica puede cancelar su suscripcion',
      });
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { companyId: effectiveCompanyId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'No tienes una suscripcion registrada',
      });
    }

    if (!subscription.externalSubscriptionId) {
      throw new BadRequestException({
        messageKey: 'SUBSCRIPTION.CANNOT_SELF_CANCEL',
        message: 'Esta suscripcion no se puede cancelar desde aqui',
      });
    }

    if (CANCELED_STATUSES.includes(subscription.status)) {
      return {
        messageKey: 'SUCCESS',
        data: { ...subscription, billingNotified: null },
      };
    }

    subscription.status = 'canceled';
    subscription.canceledAt = new Date();
    const billingNotified = await this.landingBillingClient.cancelRemote(
      subscription.externalSubscriptionId
    );
    const saved = await this.subscriptionRepository.save(subscription);

    return {
      messageKey: 'SUCCESS',
      data: { ...saved, billingNotified },
    };
  }

  private async provisionNewCompany(
    plan: Plan | null,
    dto: ProvisionSubscriptionDto
  ) {
    const { firstName, lastName } = this.splitName(dto.ownerName);
    const code = await this.generateUniqueCompanyCode();
    const slug = await this.generateUniqueSlug(dto.opticaName);
    const username = await this.generateUniqueUsername(dto.adminEmail);
    const temporaryPassword = randomBytes(12).toString('hex');

    const created = await this.companiesService.createComplete({
      name: dto.opticaName,
      code,
      companyEmail: dto.adminEmail,
      companyPhone: dto.phone,
      slug,
      maxUsers: plan?.maxUsers ?? undefined,
      maxBranches: plan?.maxBranches ?? undefined,
      branchName: 'Matriz',
      branchCode: '001',
      branchAddress: 'Por definir',
      branchCity: 'Por definir',
      username,
      email: dto.adminEmail,
      firstName,
      lastName,
      password: temporaryPassword,
      documentNumber: dto.documentId,
      mobilePhone: dto.phone,
    });

    const companyId: string = created.data.company.id;
    const roleId: string = created.data.role.id;
    const userId: string = created.data.user.id;

    try {
      await this.roleRepository.update(roleId, {
        roleName: this.buildAdminRoleName(dto.opticaName),
      });
    } catch (error) {
      this.logger.error(
        `No se pudo renombrar el rol de la optica ${companyId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`
      );
    }
    await this.grantAllPermissions(roleId);
    const subscription = await this.upsertSubscription(companyId, plan, dto);

    // La landing envía el correo de bienvenida con estos enlaces (UN solo correo),
    // así que aquí solo generamos el token de "crear contraseña" y devolvemos las
    // URLs, en vez de mandar el email desde optometría (evita el correo duplicado).
    const token = randomBytes(32).toString('hex');
    await this.userRepository.update(userId, {
      resetToken: token,
      resetTokenExpiry: new Date(Date.now() + SET_PASSWORD_TOKEN_TTL_MS),
    });

    return {
      messageKey: 'SUBSCRIPTION.PROVISIONED',
      data: {
        status: 'provisioned',
        companyId,
        userId,
        subscriptionId: subscription.id,
        setPasswordUrl: this.emailUtil.buildSetPasswordUrl(token),
        loginUrl: this.emailUtil.buildLoginUrl(),
      },
    };
  }

  private async linkExistingCompany(
    existingUser: User,
    plan: Plan | null,
    dto: ProvisionSubscriptionDto
  ) {
    const companyId = existingUser.companyId;
    await this.ensureRolePermissions(existingUser.roleId);
    const subscription = await this.upsertSubscription(companyId, plan, dto);

    return {
      messageKey: 'SUBSCRIPTION.LINKED_EXISTING',
      data: {
        status: 'linked_existing',
        companyId,
        userId: existingUser.id,
        subscriptionId: subscription.id,
        loginUrl: this.emailUtil.buildLoginUrl(),
      },
    };
  }

  private async resolvePlan(planCode?: string): Promise<Plan | null> {
    const code = planCode || DEFAULT_PLAN_CODE;
    return this.planRepository.findOne({ where: { code } });
  }

  private async upsertSubscription(
    companyId: string,
    plan: Plan | null,
    dto: ProvisionSubscriptionDto
  ): Promise<CompanySubscription> {
    const existing = await this.subscriptionRepository.findOne({
      where: { companyId },
    });

    const data: Partial<CompanySubscription> = {
      companyId,
      planId: plan?.id ?? null,
      planCode: dto.planCode ?? plan?.code ?? null,
      externalSubscriptionId: dto.externalSubscriptionId,
      status: dto.status ?? 'active',
      billingCycle: dto.billingCycle ?? plan?.billingCycle ?? null,
      amountCents: dto.amountCents ?? plan?.amountCents ?? null,
      currency: dto.currency ?? plan?.currency ?? null,
      cardBrand: dto.cardBrand ?? null,
      cardLast4: dto.cardLast4 ?? null,
      currentPeriodEnd: dto.currentPeriodEnd
        ? new Date(dto.currentPeriodEnd)
        : existing?.currentPeriodEnd ?? null,
      lastSyncedAt: new Date(),
    };

    if (existing) {
      this.subscriptionRepository.merge(existing, data);
      return this.subscriptionRepository.save(existing);
    }

    const subscription = this.subscriptionRepository.create({
      ...data,
      startedAt: new Date(),
    });
    return this.subscriptionRepository.save(subscription);
  }

  private async grantAllPermissions(roleId: string): Promise<void> {
    const permissions = await this.permissionRepository.find({
      where: { isActive: true },
    });

    if (!permissions.length) {
      return;
    }

    await this.rolePermissionRepository
      .createQueryBuilder()
      .insert()
      .values(
        permissions.map((permission) => ({
          roleId,
          permissionId: permission.id,
          isEnabled: true,
        }))
      )
      .orIgnore()
      .execute();
  }

  private async ensureRolePermissions(roleId: string): Promise<void> {
    const enabledCount = await this.rolePermissionRepository.count({
      where: { roleId, isEnabled: true },
    });

    if (enabledCount === 0) {
      await this.grantAllPermissions(roleId);
      return;
    }

    const subscriptionPermissions = await this.permissionRepository.find({
      where: SUBSCRIPTION_PERMISSION_NAMES.map((permissionName) => ({
        permissionName,
      })),
    });

    if (!subscriptionPermissions.length) {
      return;
    }

    await this.rolePermissionRepository
      .createQueryBuilder()
      .insert()
      .values(
        subscriptionPermissions.map((permission) => ({
          roleId,
          permissionId: permission.id,
          isEnabled: true,
        }))
      )
      .orIgnore()
      .execute();
  }

  private buildAdminRoleName(opticaName: string): string {
    const base = opticaName.trim().replace(/\s+/g, ' ');
    return `Admin-${base}`.slice(0, 100);
  }

  private splitName(ownerName: string): {
    firstName: string;
    lastName: string;
  } {
    const parts = ownerName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? ownerName.trim();
    const lastName = parts.slice(1).join(' ') || firstName;
    return { firstName, lastName };
  }

  private async generateUniqueCompanyCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = String(100000 + (randomBytes(4).readUInt32BE(0) % 900000));
      const exists = await this.companyRepository.findOne({
        where: { code: candidate },
      });
      if (!exists) {
        return candidate;
      }
    }
    return String(Date.now()).slice(-12);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base =
      name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'optica';

    let candidate = base;
    for (let attempt = 0; attempt < 20; attempt++) {
      const exists = await this.companyRepository.findOne({
        where: { slug: candidate },
      });
      if (!exists) {
        return candidate;
      }
      candidate = `${base}-${randomBytes(2).toString('hex')}`;
    }
    return `${base}-${Date.now().toString(36)}`;
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    const base =
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '')
        .slice(0, 24) || 'admin';
    const normalized = base.length >= 3 ? base : `${base}adm`;

    let candidate = normalized;
    for (let attempt = 0; attempt < 20; attempt++) {
      const exists = await this.userRepository.findOne({
        where: { username: candidate },
      });
      if (!exists) {
        return candidate;
      }
      candidate = `${normalized}${randomBytes(2).toString('hex')}`;
    }
    return `${normalized}${Date.now().toString(36)}`;
  }
}
