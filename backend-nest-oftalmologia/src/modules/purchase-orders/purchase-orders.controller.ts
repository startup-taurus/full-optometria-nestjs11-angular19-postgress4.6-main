import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrderBillingService } from './purchase-order-billing.service';
import { UpdatePurchaseOrderDto } from './dtos/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dtos/query-purchase-order.dto';
import { CreatePurchaseOrderInvoiceDto } from './dtos/create-purchase-order-invoice.dto';
import { RetryPurchaseOrderInvoiceDto } from './dtos/retry-purchase-order-invoice.dto';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { BranchContext } from '../../common/decorators/branch-context.decorator';

@Controller('purchase-orders')
@UseGuards(AuthGuard('jwt'))
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly purchaseOrderBillingService: PurchaseOrderBillingService,
  ) {}

  @Get('invoice/payment-methods')
  getBillingPaymentMethods() {
    return this.purchaseOrderBillingService.getPaymentMethods();
  }

  @Post(':id/invoice')
  createInvoice(
    @Param('id') id: string,
    @Body() dto: CreatePurchaseOrderInvoiceDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    console.log('[PurchaseOrdersController][createInvoice] request', {
      purchaseOrderId: id,
      branchId,
      companyId,
      paymentMethod: dto.paymentMethod,
      taxPercent: dto.taxPercent,
    });

    return this.purchaseOrderBillingService.createInvoice(
      id,
      dto,
      branchId,
      companyId,
    );
  }

  @Post(':id/invoice/retry')
  retryInvoice(
    @Param('id') id: string,
    @Body() dto: RetryPurchaseOrderInvoiceDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    console.log('[PurchaseOrdersController][retryInvoice] request', {
      purchaseOrderId: id,
      branchId,
      companyId,
      paymentMethod: dto.paymentMethod,
      taxPercent: dto.taxPercent,
    });

    return this.purchaseOrderBillingService.retryInvoice(
      id,
      dto,
      branchId,
      companyId,
    );
  }

  @Post(':id/invoice/authorize')
  authorizeInvoice(
    @Param('id') id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    console.log('[PurchaseOrdersController][authorizeInvoice] request', {
      purchaseOrderId: id,
      branchId,
      companyId,
    });

    return this.purchaseOrderBillingService.authorizeInvoice(
      id,
      branchId,
      companyId,
    );
  }

  @Post(':id/invoice/status')
  syncInvoiceStatus(
    @Param('id') id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    console.log('[PurchaseOrdersController][syncInvoiceStatus] request', {
      purchaseOrderId: id,
      branchId,
      companyId,
    });

    return this.purchaseOrderBillingService.syncInvoiceStatus(
      id,
      branchId,
      companyId,
    );
  }

  @Get(':id/invoice')
  getInvoice(
    @Param('id') id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.purchaseOrderBillingService.getInvoiceByPurchaseOrderId(
      id,
      branchId,
      companyId,
    );
  }

  @Get(':id/invoice/xml')
  getInvoiceXml(
    @Param('id') id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    console.log('[PurchaseOrdersController][getInvoiceXml] request', {
      purchaseOrderId: id,
      branchId,
      companyId,
    });

    return this.purchaseOrderBillingService.getInvoiceXml(
      id,
      branchId,
      companyId,
    );
  }

  @Get()
  findAll(
    @Query() queryDto: QueryPurchaseOrderDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.purchaseOrdersService.findAll(queryDto, branchId, companyId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.purchaseOrdersService.findOne(id, branchId, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.purchaseOrdersService.update(
      id,
      updatePurchaseOrderDto,
      branchId,
      companyId,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.purchaseOrdersService.remove(id, branchId, companyId);
  }
}
