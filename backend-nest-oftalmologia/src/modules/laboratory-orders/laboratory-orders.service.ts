import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LaboratoryOrder } from './entities/laboratory-order.entity';
import { ClinicalHistory } from '../clinical-histories/entities/clinical-history.entity';
import { Product } from '../products/entities/product.entity';
import { CreateLaboratoryOrderDto } from './dtos/create-laboratory-order.dto';
import { UpdateLaboratoryOrderDto } from './dtos/update-laboratory-order.dto';
import { QueryLaboratoryOrderDto } from './dtos/query-laboratory-order.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { CompanyFilterUtil } from '../../common/utils/company-filter.util';

@Injectable()
export class LaboratoryOrdersService {
  constructor(
    @InjectRepository(LaboratoryOrder)
    private laboratoryOrderRepository: Repository<LaboratoryOrder>,
    @InjectRepository(ClinicalHistory)
    private clinicalHistoryRepository: Repository<ClinicalHistory>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>
  ) {}

  async create(
    createDto: CreateLaboratoryOrderDto,
    branchId: string,
    companyId?: string
  ) {
    const maxRetries = 3;
    let lastError: any;
    const normalizedCreateDto = this.normalizeProductSelection(createDto);
    const attendanceDate = await this.resolveAttendanceDate(
      normalizedCreateDto,
      branchId,
      companyId
    );
    const normalizedCreateDtoWithAttendance = {
      ...normalizedCreateDto,
      attendanceDate,
    };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const orderNumber = await this.generateOrderNumber();

        const laboratoryOrder = this.laboratoryOrderRepository.create({
          ...normalizedCreateDtoWithAttendance,
          branchId,
          companyId,
          orderNumber,
        });

        const savedOrder = await this.laboratoryOrderRepository.save(
          laboratoryOrder
        );

        if (normalizedCreateDtoWithAttendance.clinicalHistoryId) {
          const whereCondition = CompanyFilterUtil.buildWhereCondition(
            { id: normalizedCreateDtoWithAttendance.clinicalHistoryId, branchId },
            companyId
          );
          await this.clinicalHistoryRepository.update(whereCondition, {
            isSent: true,
          });
        }

        const orderWithRelations = await this.laboratoryOrderRepository.findOne(
          {
            where: { id: savedOrder.id },
            relations: ['patient', 'product', 'branch'],
          }
        );

        const response = await this.formatResponse(orderWithRelations);
        return response;
      } catch (error) {
        lastError = error;
        if (error.code === '23505' && attempt < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * (attempt + 1))
          );
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  async findAll(
    queryDto: QueryLaboratoryOrderDto,
    branchId: string,
    companyId?: string
  ) {
    const {
      page,
      limit,
      patientFilterId,
      isConfirmed,
      cedula,
      firstName,
      lastName,
      email,
      mobilePhone,
      status,
      deliveryDate,
      sortBy,
      sortOrder,
    } = queryDto;

    const queryBuilder = this.laboratoryOrderRepository
      .createQueryBuilder('lo')
      .leftJoinAndSelect('lo.patient', 'patient')
      .leftJoinAndSelect('lo.product', 'product')
      .leftJoinAndSelect('lo.branch', 'branch')
      .where('lo.branchId = :branchId', { branchId });

    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'lo', companyId);

    if (patientFilterId) {
      queryBuilder.andWhere('lo.patientId = :patientFilterId', {
        patientFilterId,
      });
    }

    if (typeof isConfirmed === 'boolean') {
      queryBuilder.andWhere('lo.isConfirmed = :isConfirmed', { isConfirmed });
    }

    if (cedula) {
      queryBuilder.andWhere('patient.documentNumber ILIKE :cedula', {
        cedula: `%${cedula}%`,
      });
    }

    if (firstName) {
      queryBuilder.andWhere('patient.firstName ILIKE :firstName', {
        firstName: `%${firstName}%`,
      });
    }

    if (lastName) {
      queryBuilder.andWhere('patient.lastName ILIKE :lastName', {
        lastName: `%${lastName}%`,
      });
    }

    if (email) {
      queryBuilder.andWhere('patient.email ILIKE :email', {
        email: `%${email}%`,
      });
    }

    if (mobilePhone) {
      queryBuilder.andWhere('patient.mobilePhone ILIKE :mobilePhone', {
        mobilePhone: `%${mobilePhone}%`,
      });
    }

    if (status) {
      const isConfirmedValue =
        status === 'sent' ? true : status === 'pending' ? false : null;
      if (isConfirmedValue !== null) {
        queryBuilder.andWhere('lo.isConfirmed = :statusFilter', {
          statusFilter: isConfirmedValue,
        });
      }
    }

    if (deliveryDate) {
      queryBuilder.andWhere('lo.deliveryDate = :deliveryDate', {
        deliveryDate,
      });
    }

    queryBuilder.orderBy(`lo.${sortBy}`, sortOrder);

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const formattedData = await Promise.all(
      data.map((item) => this.formatResponse(item))
    );

    return PaginationUtil.paginate(formattedData, total, {
      page,
      limit,
    });
  }

  async findOne(id: string, branchId: string, companyId?: string) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );

    const laboratoryOrder = await this.laboratoryOrderRepository.findOne({
      where: whereCondition,
      relations: ['patient', 'product', 'branch'],
    });

    if (!laboratoryOrder) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Laboratory order not found',
      });
    }

    return this.formatResponse(laboratoryOrder);
  }

  async update(
    id: string,
    updateDto: UpdateLaboratoryOrderDto,
    branchId: string,
    companyId?: string
  ) {
    const existingOrder = await this.findOne(id, branchId, companyId);

    if (!existingOrder) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Laboratory order not found',
      });
    }

    const normalizedUpdateDto = this.normalizeProductSelection(updateDto);

    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );
    await this.laboratoryOrderRepository.update(whereCondition, normalizedUpdateDto);

    const updatedOrder = await this.findOne(id, branchId, companyId);
    return updatedOrder;
  }

  async changeStatus(
    id: string,
    isConfirmed: boolean,
    branchId: string,
    companyId?: string
  ) {
    const existingOrder = await this.findOne(id, branchId, companyId);

    if (!existingOrder) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Laboratory order not found',
      });
    }

    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );
    await this.laboratoryOrderRepository.update(whereCondition, {
      isConfirmed,
    });

    const updatedOrder = await this.findOne(id, branchId, companyId);
    return updatedOrder;
  }

  async remove(id: string, branchId: string, companyId?: string) {
    const laboratoryOrder = await this.findOne(id, branchId, companyId);

    if (!laboratoryOrder) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Laboratory order not found',
      });
    }

    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id, branchId },
      companyId
    );
    await this.laboratoryOrderRepository.delete(whereCondition);

    return {
      messageKey: 'SUCCESS.DELETED',
      message: 'Laboratory order deleted successfully',
    };
  }

  async getDataFromClinicalHistory(
    clinicalHistoryId: string,
    branchId: string,
    companyId?: string
  ) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id: clinicalHistoryId, branchId },
      companyId
    );

    const clinicalHistory = await this.clinicalHistoryRepository.findOne({
      where: whereCondition,
      relations: ['patient'],
    });

    if (!clinicalHistory) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'Clinical history not found',
      });
    }

    const latestOrderWhereCondition = CompanyFilterUtil.buildWhereCondition(
      { clinicalHistoryId, branchId },
      companyId
    );

    const latestOrder = await this.laboratoryOrderRepository.findOne({
      where: latestOrderWhereCondition,
      order: { createdAt: 'DESC' },
    });

    return {
      clinicalHistoryId: clinicalHistory.id,
      patientId: clinicalHistory.patientId,
      attendanceDate: this.toISODateOnly(clinicalHistory.createdAt),
      firstName: clinicalHistory.patient.firstName,
      lastName: clinicalHistory.patient.lastName,
      documentNumber: clinicalHistory.patient.documentNumber,
      email: clinicalHistory.patient.email,
      mobilePhone: clinicalHistory.patient.mobilePhone,
      homePhone: clinicalHistory.patient.homePhone,
      odSphere: clinicalHistory.finalRxOdSphere,
      odCylinder: clinicalHistory.finalRxOdCylinder,
      odAxis: clinicalHistory.finalRxOdAxis,
      odAdd: clinicalHistory.finalRxOdAdd,
      oiSphere: clinicalHistory.finalRxOiSphere,
      oiCylinder: clinicalHistory.finalRxOiCylinder,
      oiAxis: clinicalHistory.finalRxOiAxis,
      oiAdd: clinicalHistory.finalRxOiAdd,
      odHeight: latestOrder?.odHeight ?? null,
      odDnp: latestOrder?.odDnp ?? null,
      oiHeight: latestOrder?.oiHeight ?? null,
      oiDnp: latestOrder?.oiDnp ?? null,
      cbase: latestOrder?.cbase ?? null,
      sunDegree: latestOrder?.sunDegree ?? null,
      prism: latestOrder?.prism ?? null,
      base: latestOrder?.base ?? null,
    };
  }

  private async formatResponse(laboratoryOrder: any) {
    const productIds = this.extractProductIds(laboratoryOrder);
    const products = await this.getProductsByIds(productIds);
    const fallbackProduct = laboratoryOrder.product
      ? {
          id: laboratoryOrder.product.id,
          code: laboratoryOrder.product.code,
          name: laboratoryOrder.product.name,
          brand: laboratoryOrder.product.brand,
        }
      : null;
    const primaryProduct = products[0] || fallbackProduct;

    return {
      id: laboratoryOrder.id,
      orderNumber: laboratoryOrder.orderNumber,
      branchId: laboratoryOrder.branchId,
      patientId: laboratoryOrder.patientId,
      clinicalHistoryId: laboratoryOrder.clinicalHistoryId,
      attendanceDate: laboratoryOrder.attendanceDate,
      deliveryDate: laboratoryOrder.deliveryDate,
      odSphere: laboratoryOrder.odSphere,
      odCylinder: laboratoryOrder.odCylinder,
      odAxis: laboratoryOrder.odAxis,
      odAdd: laboratoryOrder.odAdd,
      odHeight: laboratoryOrder.odHeight,
      odDnp: laboratoryOrder.odDnp,
      oiSphere: laboratoryOrder.oiSphere,
      oiCylinder: laboratoryOrder.oiCylinder,
      oiAxis: laboratoryOrder.oiAxis,
      oiAdd: laboratoryOrder.oiAdd,
      oiHeight: laboratoryOrder.oiHeight,
      oiDnp: laboratoryOrder.oiDnp,
      cbase: laboratoryOrder.cbase,
      sunDegree: laboratoryOrder.sunDegree,
      prism: laboratoryOrder.prism,
      base: laboratoryOrder.base,
      dVertex: laboratoryOrder.dVertex,
      pantos: laboratoryOrder.pantos,
      panora: laboratoryOrder.panora,
      frameFit: laboratoryOrder.frameFit,
      profile: laboratoryOrder.profile,
      mid: laboratoryOrder.mid,
      distVp: laboratoryOrder.distVp,
      engraving: laboratoryOrder.engraving,
      productId: primaryProduct?.id || laboratoryOrder.productId,
      productIds,
      frameType: laboratoryOrder.frameType,
      frameTypeDescription: laboratoryOrder.frameTypeDescription,
      frameBrand: laboratoryOrder.frameBrand,
      frameModel: laboratoryOrder.frameModel,
      frameData: laboratoryOrder.frameData,
      frameLargerDiameter: laboratoryOrder.frameLargerDiameter,
      frameHorizontal: laboratoryOrder.frameHorizontal,
      frameVertical: laboratoryOrder.frameVertical,
      frameBridge: laboratoryOrder.frameBridge,
      observations: laboratoryOrder.observations,
      isConfirmed: laboratoryOrder.isConfirmed,
      createdAt: laboratoryOrder.createdAt,
      updatedAt: laboratoryOrder.updatedAt,
      patient: laboratoryOrder.patient
        ? {
            id: laboratoryOrder.patient.id,
            firstName: laboratoryOrder.patient.firstName,
            lastName: laboratoryOrder.patient.lastName,
            documentNumber: laboratoryOrder.patient.documentNumber,
            email: laboratoryOrder.patient.email,
            mobilePhone: laboratoryOrder.patient.mobilePhone,
            homePhone: laboratoryOrder.patient.homePhone,
          }
        : null,
      product: primaryProduct,
      products,
      branch: laboratoryOrder.branch
        ? {
            id: laboratoryOrder.branch.id,
            name: laboratoryOrder.branch.name,
            code: laboratoryOrder.branch.code,
            address: laboratoryOrder.branch.address,
            city: laboratoryOrder.branch.city,
            phone: laboratoryOrder.branch.phone,
            corporateEmail: laboratoryOrder.branch.corporateEmail,
          }
        : null,
    };
  }

  private extractProductIds(
    laboratoryOrder: Partial<LaboratoryOrder> & { product?: any }
  ): string[] {
    const idsFromArray = Array.isArray(laboratoryOrder.productIds)
      ? laboratoryOrder.productIds.filter(Boolean)
      : [];

    if (idsFromArray.length > 0) {
      return Array.from(new Set(idsFromArray));
    }

    if (laboratoryOrder.productId) {
      return [laboratoryOrder.productId];
    }

    if (laboratoryOrder.product?.id) {
      return [laboratoryOrder.product.id];
    }

    return [];
  }

  private async getProductsByIds(productIds: string[]) {
    if (!productIds.length) {
      return [];
    }

    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      select: ['id', 'code', 'name', 'brand'],
    });

    const productsById = new Map(products.map((product) => [product.id, product]));

    return productIds
      .map((productId) => productsById.get(productId))
      .filter(Boolean)
      .map((product) => ({
        id: product.id,
        code: product.code,
        name: product.name,
        brand: product.brand,
      }));
  }

  private normalizeProductSelection<
    T extends CreateLaboratoryOrderDto | UpdateLaboratoryOrderDto,
  >(dto: T): T {
    const hasProductIds = Object.prototype.hasOwnProperty.call(dto, 'productIds');
    const hasProductId = Object.prototype.hasOwnProperty.call(dto, 'productId');

    if (!hasProductIds && !hasProductId) {
      return dto;
    }

    const sourceProductIds: string[] = Array.isArray((dto as any).productIds)
      ? ((dto as any).productIds as unknown[]).filter(
          (productId): productId is string =>
            typeof productId === 'string' && productId.trim().length > 0
        )
      : [];

    const uniqueProductIds: string[] = Array.from(new Set(sourceProductIds));

    if (dto.productId && !uniqueProductIds.includes(dto.productId)) {
      uniqueProductIds.unshift(dto.productId);
    }

    if (!uniqueProductIds.length) {
      return {
        ...dto,
        productId: null,
        productIds: [],
      } as T;
    }

    return {
      ...dto,
      productId: uniqueProductIds[0],
      productIds: uniqueProductIds,
    } as T;
  }

  private async generateOrderNumber(): Promise<number> {
    const result = await this.laboratoryOrderRepository
      .createQueryBuilder('order')
      .select('MAX(order.orderNumber)', 'maxOrderNumber')
      .getRawOne();

    const maxOrderNumber = result?.maxOrderNumber || 0;
    return maxOrderNumber + 1;
  }

  private async resolveAttendanceDate(
    dto: CreateLaboratoryOrderDto,
    branchId: string,
    companyId?: string
  ): Promise<string> {
    if (dto.attendanceDate) {
      return dto.attendanceDate;
    }

    if (dto.clinicalHistoryId) {
      const whereCondition = CompanyFilterUtil.buildWhereCondition(
        { id: dto.clinicalHistoryId, branchId },
        companyId
      );

      const clinicalHistory = await this.clinicalHistoryRepository.findOne({
        where: whereCondition,
        select: { createdAt: true },
      });

      if (clinicalHistory?.createdAt) {
        return this.toISODateOnly(clinicalHistory.createdAt);
      }
    }

    return this.toISODateOnly(new Date());
  }

  private toISODateOnly(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }
}
