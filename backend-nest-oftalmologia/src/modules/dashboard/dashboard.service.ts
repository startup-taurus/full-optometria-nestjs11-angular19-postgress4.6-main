import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Shift } from '../shift-management/entities/shift.entity';
import { ClinicalHistory } from '../clinical-histories/entities/clinical-history.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { LaboratoryOrderStatus } from '../laboratory-orders/entities/laboratory-order.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { PurchaseOrderItem } from '../purchase-orders/entities/purchase-order-item.entity';
import { PurchaseOrderStatus } from '../purchase-orders/entities/purchase-order.entity';
import {
  AppointmentsTrendResponse,
  DiagnosisFrequencyResponse,
  LaboratoryOrdersStatusResponse,
  ProductsInventoryResponse,
  ShiftStatusDistributionResponse,
  PatientsAgeDemographicsResponse,
  TopProductsSoldResponse,
} from './dto/dashboard-responses.dto';
import { CompanyFilterUtil } from '../../common/utils/company-filter.util';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    @InjectRepository(ClinicalHistory)
    private readonly clinicalHistoryRepository: Repository<ClinicalHistory>,
    @InjectRepository(LaboratoryOrder)
    private readonly laboratoryOrderRepository: Repository<LaboratoryOrder>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(PurchaseOrderItem)
    private readonly purchaseOrderItemRepository: Repository<PurchaseOrderItem>
  ) {}

  async getAppointmentsTrend(
    branchId: string,
    companyId: string | null,
    months: number = 3
  ): Promise<AppointmentsTrendResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);

    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + months);
    endDate.setHours(23, 59, 59, 999);

    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      {
        branchId,
        appointmentDate: Between(startDate, endDate),
      },
      companyId
    );

    const shifts = await this.shiftRepository.find({
      where: whereCondition,
      order: { appointmentDate: 'ASC' },
    });

    const monthlyData = new Map<string, number>();
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const monthKey = currentDate.toISOString().slice(0, 7);
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, 0);
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    shifts.forEach((shift) => {
      const monthKey = new Date(shift.appointmentDate)
        .toISOString()
        .slice(0, 7);
      if (monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, monthlyData.get(monthKey) + 1);
      }
    });

    const labels = Array.from(monthlyData.keys()).sort();
    const data = labels.map((label) => monthlyData.get(label));
    const average = data.length > 0 ? shifts.length / data.length : 0;

    return {
      labels,
      data,
      total: shifts.length,
      average,
    };
  }

  async getDiagnosisFrequency(
    branchId: string,
    companyId: string | null
  ): Promise<DiagnosisFrequencyResponse> {
    const whereCondition = CompanyFilterUtil.buildWhereCondition({ branchId }, companyId);

    const clinicalHistories = await this.clinicalHistoryRepository.find({
      where: whereCondition,
      select: ['visionProblems'],
    });

    const problemsCount = new Map<string, number>();
    clinicalHistories.forEach((history) => {
      if (history.visionProblems) {
        const problems = history.visionProblems.split(',').map((p) => p.trim());
        problems.forEach((problem) => {
          if (problem) {
            problemsCount.set(problem, (problemsCount.get(problem) || 0) + 1);
          }
        });
      }
    });

    const sortedProblems = Array.from(problemsCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: sortedProblems.map(([problem]) => problem),
      data: sortedProblems.map(([, count]) => count),
      total: clinicalHistories.length,
    };
  }

  async getLaboratoryOrdersStatus(
    branchId: string,
    companyId: string | null
  ): Promise<LaboratoryOrdersStatusResponse> {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const whereCondition = CompanyFilterUtil.buildWhereCondition({ branchId }, companyId);

    const orders = await this.laboratoryOrderRepository.find({
      where: whereCondition,
      select: ['isConfirmed', 'status'],
    });

    let pending = 0;
    let sent = 0;
    let received = 0;
    let delivered = 0;

    orders.forEach((order) => {
      const status = order.status || (order.isConfirmed ? LaboratoryOrderStatus.RECEIVED : LaboratoryOrderStatus.PENDING);

      if (status === LaboratoryOrderStatus.PENDING) {
        pending++;
      } else if (status === LaboratoryOrderStatus.SENT) {
        sent++;
      } else if (status === LaboratoryOrderStatus.RECEIVED) {
        received++;
      } else if (status === LaboratoryOrderStatus.DELIVERED) {
        delivered++;
      }
    });

    return {
      labels: ['Pendientes', 'Enviadas', 'Recibidas', 'Entregadas'],
      data: [pending, sent, received, delivered],
      total: orders.length,
    };
  }

  async getProductsInventory(
    branchId: string,
    companyId: string | null
  ): Promise<ProductsInventoryResponse> {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { branchId, isActive: true },
      companyId
    );

    const products = await this.productRepository.find({
      where: whereCondition,
      select: ['name', 'quantity', 'brand'],
    });

    let lowStock = 0;
    let mediumStock = 0;
    let highStock = 0;

    const lowStockProducts: string[] = [];
    const mediumStockProducts: string[] = [];
    const highStockProducts: string[] = [];

    products.forEach((product) => {
      if (product.quantity < 10) {
        lowStock++;
        lowStockProducts.push(product.name);
      } else if (product.quantity < 50) {
        mediumStock++;
        mediumStockProducts.push(product.name);
      } else {
        highStock++;
        highStockProducts.push(product.name);
      }
    });

    return {
      labels: ['Stock Bajo (<10)', 'Stock Medio (10-49)', 'Stock Alto (≥50)'],
      data: [lowStock, mediumStock, highStock],
      total: products.length,
      details: {
        lowStock: lowStockProducts.slice(0, 10),
        mediumStock: mediumStockProducts.slice(0, 10),
        highStock: highStockProducts.slice(0, 10),
      },
    };
  }

  async getTopProductsSold(
    branchId: string,
    companyId: string | null,
    months: number = 1
  ): Promise<TopProductsSoldResponse> {
    const topLimit = 10;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const queryBuilder = this.purchaseOrderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.purchaseOrder', 'purchaseOrder')
      .where('purchaseOrder.branchId = :branchId', { branchId })
      .andWhere('purchaseOrder.status != :cancelledStatus', {
        cancelledStatus: PurchaseOrderStatus.CANCELLED,
      })
      .andWhere('purchaseOrder.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'purchaseOrder', companyId);

    const rawResults = await queryBuilder
      .select('item.productId', 'productId')
      .addSelect('item.productName', 'productName')
      .addSelect('SUM(item.quantity)', 'quantitySold')
      .addSelect('SUM(item.lineTotal)', 'totalRevenue')
      .groupBy('item.productId')
      .addGroupBy('item.productName')
      .orderBy('SUM(item.quantity)', 'DESC')
      .addOrderBy('item.productName', 'ASC')
      .limit(topLimit)
      .getRawMany<{
        productId: string;
        productName: string;
        quantitySold: string;
        totalRevenue: string;
      }>();

    const items = rawResults.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantitySold: Number(item.quantitySold),
      totalRevenue: Number(item.totalRevenue),
    }));

    return {
      labels: items.map((item) => item.productName),
      data: items.map((item) => item.quantitySold),
      total: items.reduce((acc, item) => acc + item.quantitySold, 0),
      period: `${months}m`,
      items,
    };
  }

  async getShiftStatusDistribution(
    branchId: string,
    companyId: string | null
  ): Promise<ShiftStatusDistributionResponse> {
    const queryBuilder = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.status', 'status')
      .where('shift.branchId = :branchId', { branchId });

    // Aplicar filtro por companyId usando la utilidad
    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'shift', companyId);

    const shifts = await queryBuilder.getMany();

    const statusCount = new Map<string, number>();
    shifts.forEach((shift) => {
      const statusName = shift.status?.name || 'Sin Estado';
      statusCount.set(statusName, (statusCount.get(statusName) || 0) + 1);
    });

    const labels: string[] = [];
    const data: number[] = [];
    statusCount.forEach((count, status) => {
      labels.push(status);
      data.push(count);
    });

    return {
      labels,
      data,
      total: shifts.length,
    };
  }

  async getPatientsAgeDemographics(
    branchId: string,
    companyId: string | null
  ): Promise<PatientsAgeDemographicsResponse> {
    const whereCondition = CompanyFilterUtil.buildWhereCondition({ branchId }, companyId);

    const patients = await this.patientRepository.find({
      where: whereCondition,
      select: ['dateOfBirth', 'firstName', 'lastName'],
    });

    const ageGroups = {
      '0-17': 0,
      '18-30': 0,
      '31-45': 0,
      '46-60': 0,
      '61-75': 0,
      '76+': 0,
    };

    const now = new Date();
    patients.forEach((patient) => {
      if (patient.dateOfBirth) {
        const birthDate = new Date(patient.dateOfBirth);
        const age = now.getFullYear() - birthDate.getFullYear();

        if (age <= 17) ageGroups['0-17']++;
        else if (age <= 30) ageGroups['18-30']++;
        else if (age <= 45) ageGroups['31-45']++;
        else if (age <= 60) ageGroups['46-60']++;
        else if (age <= 75) ageGroups['61-75']++;
        else ageGroups['76+']++;
      }
    });

    return {
      labels: Object.keys(ageGroups),
      data: Object.values(ageGroups),
      total: patients.length,
    };
  }
}
