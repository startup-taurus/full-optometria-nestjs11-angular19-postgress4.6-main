import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailUtil } from '../../common/utils/email.util';
import { AdminBranchSessionService } from '../../common/services/admin-branch-session.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailUtil: EmailUtil,
    private adminBranchSessionService: AdminBranchSessionService
  ) {}

  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;

    this.logger.log(`Login attempt for identifier: ${identifier}`);

    const user = await this.userRepository.findOne({
      where: [{ username: identifier }, { email: identifier }],
      relations: ['role', 'branch', 'company', 'company.logoFile'],
    });

    if (!user) {
      this.logger.warn(`User not found for identifier: ${identifier}`);
      throw new UnauthorizedException({
        messageKey: 'ERROR.INVALID_CREDENTIALS',
      });
    }

    this.logger.log(
      `User found: ${user.username} (${user.email}) - Role: ${
        user.role?.roleName || 'No role'
      }`
    );

    if (!user.isActive) {
      this.logger.warn(`Inactive user login attempt: ${identifier}`);
      throw new UnauthorizedException({
        messageKey: 'ERROR.UNAUTHORIZED',
      });
    }

    if (user.isLocked) {
      this.logger.warn(`Locked user login attempt: ${identifier}`);
      throw new UnauthorizedException({
        messageKey: 'ERROR.UNAUTHORIZED',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${identifier}`);
      await this.userRepository.update(user.id, {
        failedLoginAttempts: user.failedLoginAttempts + 1,
      });

      if (user.failedLoginAttempts >= 4) {
        this.logger.warn(`User locked due to failed attempts: ${identifier}`);
        await this.userRepository.update(user.id, {
          isLocked: true,
        });
      }

      throw new UnauthorizedException({
        messageKey: 'ERROR.INVALID_CREDENTIALS',
      });
    }

    await this.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lastLoginAt: new Date(),
    });

    const tokens = await this.generateTokens(user);

    return {
      messageKey: 'AUTH.LOGIN.SUCCESS',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          branch: user.branch,
          company: user.company,
          profilePhoto: user.profilePhoto,
          address: user.address,
          documentNumber: user.documentNumber,
          dateOfBirth: user.dateOfBirth,
          homePhone: user.homePhone,
          mobilePhone: user.mobilePhone,
        },
        ...tokens,
      },
    };
  }

  async refresh(refreshDto: RefreshDto) {
    const { refreshToken } = refreshDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['role'],
      });

      if (!user || !user.isActive || user.isLocked) {
        throw new UnauthorizedException({
          messageKey: 'ERROR.UNAUTHORIZED',
        });
      }

      const tokens = await this.generateTokens(user);

      return {
        messageKey: 'AUTH.REFRESH.SUCCESS',
        data: tokens,
      };
    } catch (error) {
      throw new UnauthorizedException({
        messageKey: 'ERROR.INVALID_TOKEN',
      });
    }
  }

  async getMeUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
        'branch',
        'company',
        'company.logoFile',
      ],
    });

    if (!user) {
      throw new UnauthorizedException({
        messageKey: 'ERROR.UNAUTHORIZED',
      });
    }

    const permissionIds =
      user.role?.rolePermissions
        ?.filter((rp) => rp.isEnabled && rp.permission.isActive)
        ?.map((rp) => rp.permission.id) || [];

    const isAdmin =
      user.role?.roleName === 'Admin' || user.role?.roleName === 'SUPER_ADMIN';

    return {
      messageKey: 'AUTH.GET_ME.SUCCESS',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branch: user.branch,
        company: user.company,
        isAdmin: isAdmin,
        profilePhoto: user.profilePhoto,
        address: user.address,
        documentNumber: user.documentNumber,
        dateOfBirth: user.dateOfBirth,
        homePhone: user.homePhone,
        mobilePhone: user.mobilePhone,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        permissionIds: permissionIds,
      },
    };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      companyId: user.companyId || null,
      branchId: user.branchId || null,
    };

    const refreshPayload = {
      sub: user.id,
      username: user.username,
      tokenType: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: 'User not found',
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException({
        messageKey: 'ERROR.INVALID_CURRENT_PASSWORD',
        message: 'Current password is incorrect',
      });
    }

    const saltRounds =
      this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.userRepository.update(userId, {
      passwordHash,
    });

    return {
      messageKey: 'AUTH.PASSWORD_CHANGED',
      message: 'Password changed successfully',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      this.logger.warn(
        `Password reset attempt for non-existent email: ${email}`
      );
      return {
        messageKey: 'AUTH.RESET_EMAIL_SENT',
        message:
          'Se ha enviado un enlace de restablecimiento a tu correo electrónico',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);
    await this.userRepository.update(user.id, {
      resetToken,
      resetTokenExpiry,
    });

    try {
      await this.emailUtil.sendResetPasswordEmail(user.email, resetToken);
      this.logger.log(`Password reset email sent successfully to: ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send reset email to ${email}`,
        error.message
      );
      throw new BadRequestException({
        messageKey: 'ERROR.EMAIL_SEND_FAILED',
        message:
          'Error al enviar el correo de recuperación. Verifica la configuración del servidor de correo.',
      });
    }

    return {
      messageKey: 'AUTH.RESET_EMAIL_SENT',
      message:
        'Se ha enviado un enlace de restablecimiento a tu correo electrónico',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: {
        resetToken: token,
      },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException({
        messageKey: 'ERROR.INVALID_OR_EXPIRED_TOKEN',
        message: 'Invalid or expired reset token',
      });
    }

    const saltRounds =
      this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.userRepository.update(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return {
      messageKey: 'AUTH.PASSWORD_RESET',
      message: 'Password has been reset successfully',
    };
  }

  async setAdminBranchFilter(userId: string, branchId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (
      !user ||
      (user.role?.roleName !== 'Admin' && user.role?.roleName !== 'SUPER_ADMIN')
    ) {
      throw new UnauthorizedException({
        messageKey: 'ERROR.ADMIN_REQUIRED',
        message: 'Only admin users can set branch filters',
      });
    }

    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundException({
        messageKey: 'ERROR.BRANCH_NOT_FOUND',
        message: 'Branch not found',
      });
    }

    if (!branch.isActive) {
      throw new BadRequestException({
        messageKey: 'ERROR.BRANCH_INACTIVE',
        message: 'Branch is not active',
      });
    }

    this.adminBranchSessionService.setAdminBranchSelection(userId, branchId);

    return {
      messageKey: 'AUTH.ADMIN_BRANCH_FILTER_SET',
      message: 'Admin branch filter set successfully',
      data: {
        selectedBranch: branch,
        isTemporarySelection: true,
      },
    };
  }

  async clearAdminBranchFilter(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'branch'],
    });

    if (
      !user ||
      (user.role?.roleName !== 'Admin' && user.role?.roleName !== 'SUPER_ADMIN')
    ) {
      throw new UnauthorizedException({
        messageKey: 'ERROR.ADMIN_REQUIRED',
        message: 'Only admin users can clear branch filters',
      });
    }

    this.adminBranchSessionService.clearAdminBranchSelection(userId);

    return {
      messageKey: 'AUTH.ADMIN_BRANCH_FILTER_CLEARED',
      message: 'Admin branch filter cleared successfully',
      data: {
        defaultBranch: user.branch,
        isTemporarySelection: false,
      },
    };
  }
}
