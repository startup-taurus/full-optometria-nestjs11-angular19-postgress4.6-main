import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClinicalHistoriesService } from './clinical-histories.service';
import { CreateClinicalHistoryDto } from './dtos/create-clinical-history.dto';
import { UpdateClinicalHistoryDto } from './dtos/update-clinical-history.dto';
import { QueryClinicalHistoryDto } from './dtos/query-clinical-history.dto';
import { ChangeStatusDto } from './dtos/change-status.dto';
import { BranchContext } from '../../common/decorators/branch-context.decorator';
import { CompanyId } from '../../common/decorators/company-context.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('clinical-histories')
@UseGuards(AuthGuard('jwt'))
export class ClinicalHistoriesController {
  constructor(
    private readonly clinicalHistoriesService: ClinicalHistoriesService
  ) {}

  @Post('create')
  @RequirePermissions('clinical_history_create')
  async create(
    @Body(ValidationPipe) createDto: CreateClinicalHistoryDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.clinicalHistoriesService.create(createDto, branchId, companyId);
  }

  @Get('get-all')
  @RequirePermissions('clinical_history_read')
  async findAll(
    @Query(ValidationPipe) queryDto: QueryClinicalHistoryDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.clinicalHistoriesService.findAll(queryDto, branchId, companyId);
  }

  @Get('by-patient/:patientId')
  @RequirePermissions('clinical_history_read')
  async findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.clinicalHistoriesService.findByPatient(patientId, branchId, companyId);
  }

  @Get(':id')
  @RequirePermissions('clinical_history_read')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.clinicalHistoriesService.findOne(id, branchId, companyId);
  }

  @Patch('update/:id')
  @RequirePermissions('clinical_history_update')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDto: UpdateClinicalHistoryDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.clinicalHistoriesService.update(id, updateDto, branchId, companyId);
  }

  @Patch('change-status/:id')
  @RequirePermissions('clinical_history_update')
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) statusDto: ChangeStatusDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.clinicalHistoriesService.changeStatus(
      id,
      statusDto.isSent,
      branchId,
      companyId
    );
  }

  @Delete('delete/:id')
  @RequirePermissions('clinical_history_delete')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.clinicalHistoriesService.remove(id, branchId, companyId);
  }
}
