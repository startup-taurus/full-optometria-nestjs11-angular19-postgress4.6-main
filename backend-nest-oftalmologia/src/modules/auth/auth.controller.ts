import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserPermissionsService } from '../roles-permissions/services/user-permissions.service';
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly userPermissionsService: UserPermissionsService
  ) {}
  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    this.logger.log(`Login attempt for: ${loginDto.identifier}`);
    const result = await this.authService.login(loginDto);
    this.logger.log(
      `Login ${result.data ? 'successful' : 'failed'} for: ${
        loginDto.identifier
      }`
    );
    return result;
  }
  @Post('refresh')
  async refresh(@Body(ValidationPipe) refreshDto: RefreshDto) {
    this.logger.log('Token refresh attempt');
    return this.authService.refresh(refreshDto);
  }
  @Get('get-me-user')
  @UseGuards(AuthGuard('jwt'))
  async getMeUser(@CurrentUser() user: User) {
    this.logger.log(`Getting user info for ID: ${user.id}`);
    return this.authService.getMeUser(user.id);
  }
  @Get('profile-with-permissions')
  @UseGuards(AuthGuard('jwt'))
  async getProfileWithPermissions(@CurrentUser() user: User) {
    this.logger.log(`Getting permissions for user ID: ${user.id}`);
    const result = await this.userPermissionsService.getUserPermissions(
      user.id
    );
    this.logger.log(`User ${user.id} permissions loaded successfully`);
    return result;
  }

  @Post('set-admin-branch-filter')
  @UseGuards(AuthGuard('jwt'))
  async setAdminBranchFilter(
    @CurrentUser() user: User,
    @Body() setAdminBranchFilterDto: any
  ) {
    this.logger.log(`Admin ${user.id} setting branch filter to: ${setAdminBranchFilterDto.branchId}`);
    return this.authService.setAdminBranchFilter(user.id, setAdminBranchFilterDto.branchId);
  }

  @Post('clear-admin-branch-filter')
  @UseGuards(AuthGuard('jwt'))
  async clearAdminBranchFilter(@CurrentUser() user: User) {
    this.logger.log(`Admin ${user.id} clearing branch filter`);
    return this.authService.clearAdminBranchFilter(user.id);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(
    @CurrentUser() user: User,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto
  ) {
    this.logger.log(`Password change request for user ID: ${user.id}`);
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(`Forgot password request for email: ${forgotPasswordDto.email}`);
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body(ValidationPipe) resetPasswordDto: ResetPasswordDto) {
    this.logger.log(`Reset password request with token: ${resetPasswordDto.token}`);
    return this.authService.resetPassword(resetPasswordDto);
  }
}
