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

@Controller('patients')
@UseGuards(AuthGuard('jwt'))
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  create(
    @Body() createPatientDto: CreatePatientDto,
    @CompanyId() companyId: string | null
  ) {
    return this.patientsService.create(createPatientDto, companyId);
  }

  @Get()
  findAll(
    @Query() queryDto: QueryPatientDto,
    @CompanyId() companyId: string | null
  ) {
    return this.patientsService.findAll(queryDto, companyId);
  }

  @Get('search')
  search(@Query('q') query: string, @CompanyId() companyId: string | null) {
    return this.patientsService.searchPatients(query, companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CompanyId() companyId: string | null) {
    return this.patientsService.findOne(id, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @CompanyId() companyId: string | null
  ) {
    return this.patientsService.update(id, updatePatientDto, companyId);
  }

  @Post(':id/profile-photo')
  @UseInterceptors(FileInterceptor('file'))
  uploadProfilePhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.patientsService.uploadProfilePhoto(id, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CompanyId() companyId: string | null) {
    return this.patientsService.remove(id, companyId);
  }
}
