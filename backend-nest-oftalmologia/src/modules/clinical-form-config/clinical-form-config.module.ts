import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalFormConfigService } from './clinical-form-config.service';
import { ClinicalFormConfigController } from './clinical-form-config.controller';
import { ClinicalFormConfig } from './entities/clinical-form-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicalFormConfig])],
  controllers: [ClinicalFormConfigController],
  providers: [ClinicalFormConfigService],
  exports: [ClinicalFormConfigService],
})
export class ClinicalFormConfigModule {}
