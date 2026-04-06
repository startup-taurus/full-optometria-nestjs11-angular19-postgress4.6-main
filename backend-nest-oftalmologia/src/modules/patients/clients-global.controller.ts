import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BranchContext } from '../../common/decorators/branch-context.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dtos/create-client.dto';
import { QueryGlobalClientDto } from './dtos/query-global-client.dto';
import { UpdateClientDto } from './dtos/update-client.dto';

@Controller('clients')
@UseGuards(AuthGuard('jwt'))
export class ClientsGlobalController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(
    @Body() createClientDto: CreateClientDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.clientsService.createGlobal(createClientDto, branchId, companyId);
  }

  @Get()
  findAll(
    @Query() queryDto: QueryGlobalClientDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.clientsService.findAllGlobal(queryDto, branchId, companyId);
  }

  @Get('search/:documentNumber')
  searchByDocumentNumber(
    @Param('documentNumber') documentNumber: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.clientsService.searchGlobalByDocumentNumber(
      documentNumber,
      branchId,
      companyId,
    );
  }

  @Get(':clientId')
  findOne(
    @Param('clientId') clientId: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.clientsService.findOneGlobal(clientId, branchId, companyId);
  }

  @Patch(':clientId')
  update(
    @Param('clientId') clientId: string,
    @Body() updateClientDto: UpdateClientDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.clientsService.updateGlobal(
      clientId,
      updateClientDto,
      branchId,
      companyId,
    );
  }

  @Delete(':clientId')
  remove(
    @Param('clientId') clientId: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.clientsService.removeGlobal(clientId, branchId, companyId);
  }
}
