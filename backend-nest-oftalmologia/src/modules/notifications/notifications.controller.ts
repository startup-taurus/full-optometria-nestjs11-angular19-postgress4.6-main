import { Body, Controller, Get, MessageEvent, Patch, Post, Query, Sse, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { BranchContext } from '../../common/decorators/branch-context.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MarkWhatsAppConnectedDto } from './dtos/mark-whatsapp-connected.dto';
import { QueryRenewalEligibleDto } from './dtos/query-renewal-eligible.dto';
import { SendManualRenewalDto } from './dtos/send-manual-renewal.dto';
import { UpdateReminderRuleDto } from './dtos/update-reminder-rule.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('whatsapp/session/init')
  initWhatsAppSession(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.initWhatsAppSession(branchId, companyId, user.id);
  }

  @Get('whatsapp/session')
  getWhatsAppSession(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.getWhatsAppSession(branchId, companyId, user.id);
  }

  @Sse('whatsapp/session/stream')
  streamWhatsAppSession(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any,
  ): Observable<MessageEvent> {
    return this.notificationsService.streamWhatsAppSession(branchId, companyId, user.id);
  }

  @Post('whatsapp/session/refresh-qr')
  refreshWhatsAppQr(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.refreshWhatsAppQr(branchId, companyId, user.id);
  }

  @Post('whatsapp/session/mark-connected')
  markWhatsAppConnected(
    @Body() dto: MarkWhatsAppConnectedDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.markWhatsAppConnected(dto, branchId, companyId, user.id);
  }

  @Post('whatsapp/session/logout')
  logoutWhatsAppSession(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.logoutWhatsAppSession(branchId, companyId, user.id);
  }

  @Get('reminders/rule')
  getReminderRule(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.notificationsService.getReminderRule(branchId, companyId);
  }

  @Patch('reminders/rule')
  updateReminderRule(
    @Body() dto: UpdateReminderRuleDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.notificationsService.updateReminderRule(dto, branchId, companyId);
  }

  @Get('reminders/renewal-eligible')
  findRenewalEligiblePatients(
    @Query() queryDto: QueryRenewalEligibleDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.notificationsService.findRenewalEligiblePatients(
      queryDto,
      branchId,
      companyId,
    );
  }

  @Post('reminders/renewal/manual-send')
  sendManualRenewalReminder(
    @Body() dto: SendManualRenewalDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.sendManualRenewalReminder(dto, branchId, companyId, user.id);
  }
}
