import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dtos/create-feedback.dto';
import { QueryFeedbackDto } from './dtos/query-feedback.dto';
import { BranchContext } from '../../common/decorators/branch-context.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { UpdateFeedbackStatusDto } from './dtos/update-feedback-status.dto';

@Controller('feedback')
@UseGuards(AuthGuard('jwt'))
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 3))
  create(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @UploadedFiles() files: Express.Multer.File[],
    @BranchContext() branchId: string | null,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any,
  ) {
    return this.feedbackService.create(
      createFeedbackDto,
      files,
      branchId,
      companyId,
      user.id,
    );
  }

  @Get()
  findAll(
    @Query() queryDto: QueryFeedbackDto,
    @BranchContext() branchId: string | null,
    @CompanyId() companyId: string | null,
  ) {
    return this.feedbackService.findAll(queryDto, branchId, companyId);
  }

  @Get('admin/list')
  @UseGuards(SuperAdminGuard)
  findAllForAdmin(@Query() queryDto: QueryFeedbackDto) {
    return this.feedbackService.findAllForAdmin(queryDto);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any,
  ) {
    return this.feedbackService.findOne(id, companyId, user.id, false);
  }

  @Patch(':id/status')
  @UseGuards(SuperAdminGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() updateFeedbackStatusDto: UpdateFeedbackStatusDto,
    @CompanyId() companyId: string | null,
  ) {
    return this.feedbackService.updateStatus(
      id,
      updateFeedbackStatusDto,
      companyId,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any,
  ) {
    const isSuperAdmin =
      user?.companyId === null && user?.role?.roleName === 'SUPER_ADMIN';
    return this.feedbackService.remove(id, companyId, user.id, isSuperAdmin);
  }
}
