import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions.service';
import { ProvisionSubscriptionDto } from '../dtos/provision-subscription.dto';
import { SyncSubscriptionDto } from '../dtos/sync-subscription.dto';
import { ProvisionKeyGuard } from '../guards/provision-key.guard';

@Controller('provisioning')
@UseGuards(ProvisionKeyGuard)
export class ProvisioningController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('subscriptions')
  @HttpCode(200)
  provisionSubscription(
    @Body(ValidationPipe) dto: ProvisionSubscriptionDto
  ) {
    return this.subscriptionsService.provisionFromPayment(dto);
  }

  @Post('subscriptions/sync')
  @HttpCode(200)
  syncSubscription(@Body(ValidationPipe) dto: SyncSubscriptionDto) {
    return this.subscriptionsService.syncFromLanding(dto);
  }
}
