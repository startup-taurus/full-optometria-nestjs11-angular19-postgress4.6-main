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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { QueryCategoryDto } from './dtos/query-category.dto';
import { BranchContext } from '../../common/decorators/branch-context.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';

@Controller('categories')
@UseGuards(AuthGuard('jwt'))
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post('create')
  async create(
    @Body(ValidationPipe) createCategoryDto: CreateCategoryDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.categoriesService.create(createCategoryDto, branchId, companyId);
  }

  @Get('get-all')
  async findAll(
    @Query(ValidationPipe) queryDto: QueryCategoryDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.categoriesService.findAll(queryDto, branchId, companyId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.categoriesService.findOne(id, branchId, companyId);
  }

  @Patch('update/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateCategoryDto: UpdateCategoryDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.categoriesService.update(id, updateCategoryDto, branchId, companyId);
  }

  @Delete('delete/:id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.categoriesService.remove(id, branchId, companyId);
  }
}
