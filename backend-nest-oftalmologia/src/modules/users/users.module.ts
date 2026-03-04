import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { RolesPermissionsModule } from '../roles-permissions/roles-permissions.module';
import { FilesModule } from '../files/files.module';
import { CompanyQuotaModule } from '../company-quota/company-quota.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
    RolesPermissionsModule,
    FilesModule,
    CompanyQuotaModule,
    MulterModule.register({
      limits: {
        fileSize: 8 * 1024 * 1024,
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
