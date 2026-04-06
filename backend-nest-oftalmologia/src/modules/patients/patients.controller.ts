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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dtos/create-patient.dto';
import { UpdatePatientDto } from './dtos/update-patient.dto';
import { QueryPatientDto } from './dtos/query-patient.dto';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { BranchContext } from '../../common/decorators/branch-context.decorator';

@Controller('patients')
@UseGuards(AuthGuard('jwt'))
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  create(
    @Body() createPatientDto: CreatePatientDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.patientsService.create(createPatientDto, branchId, companyId);
  }

  @Get()
  findAll(
    @Query() queryDto: QueryPatientDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.patientsService.findAll(queryDto, branchId, companyId);
  }

  @Get('search')
  search(
    @Query('q') query: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.patientsService.searchPatients(query, branchId, companyId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.patientsService.findOne(id, branchId, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.patientsService.update(id, updatePatientDto, branchId, companyId);
  }

  @Post(':id/profile-photo')
  @UseInterceptors(FileInterceptor('file'))
  uploadProfilePhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.patientsService.uploadProfilePhoto(id, file, branchId, companyId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @Query('deleteAssociatedClients') deleteAssociatedClients?: string
  ) {
    const shouldDeleteAssociatedClients =
      (deleteAssociatedClients || '').toLowerCase() === 'true';

    return this.patientsService.remove(
      id,
      branchId,
      companyId,
      shouldDeleteAssociatedClients
    );
  }
}
