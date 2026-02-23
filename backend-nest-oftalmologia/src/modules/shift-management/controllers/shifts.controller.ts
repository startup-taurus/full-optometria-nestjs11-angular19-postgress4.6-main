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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShiftsService } from '../services/shifts.service';
import { CreateShiftDto } from '../dtos/create-shift.dto';
import { UpdateShiftDto } from '../dtos/update-shift.dto';
import { QueryShiftDto } from '../dtos/query-shift.dto';
import { BranchContext } from '../../../common/decorators/branch-context.decorator';
import { CompanyId } from '../../../common/decorators/company-context.decorator';

@Controller('shift-management/shifts')
@UseGuards(AuthGuard('jwt'))
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('create')
  async create(
    @Body(ValidationPipe) createShiftDto: CreateShiftDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.shiftsService.create(createShiftDto, branchId, companyId);
  }

  @Get('get-all')
  async findAll(
    @Query(ValidationPipe) queryDto: QueryShiftDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.shiftsService.findAll(queryDto, branchId, companyId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string, 
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.shiftsService.findOne(id, branchId, companyId);
  }

  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateShiftDto: UpdateShiftDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.shiftsService.update(id, updateShiftDto, branchId, companyId);
  }

  @Delete('delete/:id')
  async remove(
    @Param('id') id: string, 
    @BranchContext() branchId: string,
    @CompanyId() companyId?: string
  ) {
    return this.shiftsService.remove(id, branchId, companyId);
  }
}
