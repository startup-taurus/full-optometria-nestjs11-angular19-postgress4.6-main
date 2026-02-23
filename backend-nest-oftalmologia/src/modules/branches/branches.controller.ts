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
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dtos/create-branch.dto';
import { UpdateBranchDto } from './dtos/update-branch.dto';
import { QueryBranchDto } from './dtos/query-branch.dto';
import { CompanyId } from '../../common/decorators/company-context.decorator';

@Controller('branches')
@UseGuards(AuthGuard('jwt'))
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post('create')
  async create(@Body(ValidationPipe) createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get('get-all')
  async findAll(
    @Query(ValidationPipe) queryDto: QueryBranchDto,
    @CompanyId() companyId: string | null
  ) {
    return this.branchesService.findAll(queryDto, companyId);
  }

  @Get('get-all-selector')
  async findAllForSelector(@CompanyId() companyId: string | null) {
    return this.branchesService.findAllForSelector(companyId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CompanyId() companyId: string | null
  ) {
    return this.branchesService.findOne(id, companyId);
  }

  @Patch('update/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateBranchDto: UpdateBranchDto,
    @CompanyId() companyId: string | null
  ) {
    return this.branchesService.update(id, updateBranchDto, companyId);
  }

  @Delete('delete/:id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CompanyId() companyId: string | null
  ) {
    return this.branchesService.remove(id, companyId);
  }
}
