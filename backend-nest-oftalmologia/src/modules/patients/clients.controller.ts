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
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dtos/create-client.dto';
import { UpdateClientDto } from './dtos/update-client.dto';
import { QueryClientDto } from './dtos/query-client.dto';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { BranchContext } from '../../common/decorators/branch-context.decorator';

@Controller('patients/:patientId/clients')
@UseGuards(AuthGuard('jwt'))
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(
    @Param('patientId') patientId: string,
    @Body() createClientDto: CreateClientDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.clientsService.create(patientId, createClientDto, branchId, companyId);
  }

  @Get()
  findAll(
    @Param('patientId') patientId: string,
    @Query() queryDto: QueryClientDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.clientsService.findAllByPatient(patientId, queryDto, branchId, companyId);
  }

  @Get('search/:documentNumber')
  search(
    @Param('patientId') patientId: string,
    @Param('documentNumber') documentNumber: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.clientsService.searchByDocumentNumber(patientId, documentNumber, branchId, companyId);
  }

  @Get(':clientId')
  findOne(
    @Param('patientId') patientId: string,
    @Param('clientId') clientId: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.clientsService.findOne(patientId, clientId, branchId, companyId);
  }

  @Patch(':clientId')
  update(
    @Param('patientId') patientId: string,
    @Param('clientId') clientId: string,
    @Body() updateClientDto: UpdateClientDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.clientsService.update(patientId, clientId, updateClientDto, branchId, companyId);
  }

  @Delete(':clientId')
  remove(
    @Param('patientId') patientId: string,
    @Param('clientId') clientId: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.clientsService.remove(patientId, clientId, branchId, companyId);
  }
}
