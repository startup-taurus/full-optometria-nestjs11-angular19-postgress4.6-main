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
import { LaboratoryOrdersService } from './laboratory-orders.service';
import { CreateLaboratoryOrderDto } from './dtos/create-laboratory-order.dto';
import { UpdateLaboratoryOrderDto } from './dtos/update-laboratory-order.dto';
import { QueryLaboratoryOrderDto } from './dtos/query-laboratory-order.dto';
import { ChangeStatusDto } from './dtos/change-status.dto';
import { BranchContext } from '../../common/decorators/branch-context.decorator';
import { CompanyId } from '../../common/decorators/company-context.decorator';

@Controller('laboratory-orders')
@UseGuards(AuthGuard('jwt'))
export class LaboratoryOrdersController {
  constructor(
    private readonly laboratoryOrdersService: LaboratoryOrdersService
  ) {}

  @Post('create')
  async create(
    @Body(ValidationPipe) createDto: CreateLaboratoryOrderDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    try {
      const result = await this.laboratoryOrdersService.create(createDto, branchId, companyId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get('get-all')
  async findAll(
    @Query(ValidationPipe) queryDto: QueryLaboratoryOrderDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.laboratoryOrdersService.findAll(queryDto, branchId, companyId);
  }

  @Get('from-clinical-history/:clinicalHistoryId')
  async getDataFromClinicalHistory(
    @Param('clinicalHistoryId', ParseUUIDPipe) clinicalHistoryId: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.laboratoryOrdersService.getDataFromClinicalHistory(
      clinicalHistoryId,
      branchId,
      companyId
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.laboratoryOrdersService.findOne(id, branchId, companyId);
  }

  @Patch('update/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDto: UpdateLaboratoryOrderDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.laboratoryOrdersService.update(id, updateDto, branchId, companyId);
  }

  @Patch('change-status/:id')
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) statusDto: ChangeStatusDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.laboratoryOrdersService.changeStatus(
      id,
      statusDto.status,
      branchId,
      companyId
    );
  }

  @Delete('delete/:id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.laboratoryOrdersService.remove(id, branchId, companyId);
  }
}
