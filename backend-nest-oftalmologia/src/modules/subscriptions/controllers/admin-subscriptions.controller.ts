import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';
import { AdminSubscriptionsService } from '../admin-subscriptions.service';
import { ListSubscriptionsQueryDto } from '../dtos/list-subscriptions.query.dto';
import {
  ManageSubscriptionDto,
  ReactivateSubscriptionDto,
  SetCompanyActiveDto,
} from '../dtos/manage-subscription.dto';

@Controller('subscriptions/admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminSubscriptionsController {
  constructor(
    private readonly adminSubscriptionsService: AdminSubscriptionsService,
  ) {}

  @Get()
  listAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ListSubscriptionsQueryDto,
  ) {
    return this.adminSubscriptionsService.listAll(query);
  }

  @Get('plans')
  listPlans() {
    return this.adminSubscriptionsService.listPlans();
  }

  @Patch(':companyId')
  manage(
    @Param('companyId') companyId: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: ManageSubscriptionDto,
  ) {
    return this.adminSubscriptionsService.manage(companyId, dto);
  }

  @Post(':companyId/cancel')
  cancel(@Param('companyId') companyId: string) {
    return this.adminSubscriptionsService.cancel(companyId);
  }

  @Post(':companyId/reactivate')
  reactivate(
    @Param('companyId') companyId: string,
    @Body(new ValidationPipe({ whitelist: true }))
    dto: ReactivateSubscriptionDto,
  ) {
    return this.adminSubscriptionsService.reactivate(companyId, dto);
  }

  // Activar/desactivar la EMPRESA (bloquea/permite el login de sus usuarios).
  // Distinto de cancelar la suscripción: aquí no se toca el cobro.
  @Post(':companyId/company-active')
  setCompanyActive(
    @Param('companyId') companyId: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: SetCompanyActiveDto,
  ) {
    return this.adminSubscriptionsService.setCompanyActive(
      companyId,
      dto.isActive,
    );
  }
}
