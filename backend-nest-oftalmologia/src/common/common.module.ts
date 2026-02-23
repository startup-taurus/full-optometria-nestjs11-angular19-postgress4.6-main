import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolePermission } from '../modules/roles-permissions/entities/role-permission.entity';
import { Permission } from '../modules/roles-permissions/entities/permission.entity';
import { Branch } from '../modules/branches/entities/branch.entity';
import { User } from '../modules/users/entities/user.entity';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { EmailUtil } from './utils/email.util';
import { BranchFilterMiddleware } from './middleware/branch-filter.middleware';
import { AuthRoleMiddleware } from './middleware/auth-role.middleware';
import { AdminBranchSessionService } from './services/admin-branch-session.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([RolePermission, Permission, Branch, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    RolesGuard,
    PermissionsGuard,
    EmailUtil,
    BranchFilterMiddleware,
    AuthRoleMiddleware,
    AdminBranchSessionService,
  ],
  exports: [
    RolesGuard,
    PermissionsGuard,
    EmailUtil,
    BranchFilterMiddleware,
    AuthRoleMiddleware,
    AdminBranchSessionService,
  ],
})
export class CommonModule {}
