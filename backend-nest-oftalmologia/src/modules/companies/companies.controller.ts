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
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { CreateCompanyCompleteDto } from './dtos/create-company-complete.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { QueryCompanyDto } from './dtos/query-company.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

@Controller('companies')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Post('complete')
  createComplete(@Body() createCompanyCompleteDto: CreateCompanyCompleteDto) {
    return this.companiesService.createComplete(createCompanyCompleteDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryCompanyDto) {
    return this.companiesService.findAll(queryDto);
  }

  @Get('selector/active')
  findAllForSelector() {
    return this.companiesService.findAllForSelector();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
