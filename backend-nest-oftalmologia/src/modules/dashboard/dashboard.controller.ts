import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { BranchContext } from '../../common/decorators/branch-context.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('appointments-trend')
  @RequirePermissions('dashboard_read')
  async getAppointmentsTrend(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @Query('months') months?: string
  ) {
    const monthsNumber = months ? parseInt(months, 10) : 6;
    return this.dashboardService.getAppointmentsTrend(branchId, companyId, monthsNumber);
  }

  @Get('diagnosis-frequency')
  @RequirePermissions('dashboard_read')
  async getDiagnosisFrequency(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.dashboardService.getDiagnosisFrequency(branchId, companyId);
  }

  @Get('laboratory-orders-status')
  @RequirePermissions('dashboard_read')
  async getLaboratoryOrdersStatus(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.dashboardService.getLaboratoryOrdersStatus(branchId, companyId);
  }

  @Get('products-inventory')
  @RequirePermissions('dashboard_read')
  async getProductsInventory(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.dashboardService.getProductsInventory(branchId, companyId);
  }

  @Get('shift-status-distribution')
  @RequirePermissions('dashboard_read')
  async getShiftStatusDistribution(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.dashboardService.getShiftStatusDistribution(branchId, companyId);
  }

  @Get('patients-age-demographics')
  @RequirePermissions('dashboard_read')
  async getPatientsAgeDemographics(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.dashboardService.getPatientsAgeDemographics(branchId, companyId);
  }
}
