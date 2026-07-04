import {
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanyId } from '../../../common/decorators/company-id.decorator';
import { BranchContext } from '../../../common/decorators/branch-context.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { SubscriptionsService } from '../subscriptions.service';

@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'))
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @RequirePermissions('VIEW_SUBSCRIPTION')
  getMySubscription(
    @CompanyId() companyId: string | null,
    @BranchContext() branchId: string | null
  ) {
    return this.subscriptionsService.getCompanySubscription(companyId, branchId);
  }

  @Post('me/cancel')
  @HttpCode(200)
  @RequirePermissions('VIEW_SUBSCRIPTION')
  cancelMySubscription(
    @CompanyId() companyId: string | null,
    @BranchContext() branchId: string | null
  ) {
    return this.subscriptionsService.cancelOwnSubscription(companyId, branchId);
  }

  @Patch('company-logo')
  @RequirePermissions('VIEW_SUBSCRIPTION')
  @UseInterceptors(FileInterceptor('file'))
  updateCompanyLogo(
    @CompanyId() companyId: string | null,
    @BranchContext() branchId: string | null,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.subscriptionsService.updateOwnCompanyLogo(
      companyId,
      branchId,
      file
    );
  }
}
