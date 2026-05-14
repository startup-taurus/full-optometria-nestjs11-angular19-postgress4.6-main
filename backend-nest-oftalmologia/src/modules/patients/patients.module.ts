import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { Patient } from './entities/patient.entity';
import { Client } from './entities/client.entity';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { ClientsGlobalController } from './clients-global.controller';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, Client]), FilesModule],
  controllers: [PatientsController, ClientsController, ClientsGlobalController],
  providers: [PatientsService, ClientsService],
  exports: [PatientsService, ClientsService],
})
export class PatientsModule {}
