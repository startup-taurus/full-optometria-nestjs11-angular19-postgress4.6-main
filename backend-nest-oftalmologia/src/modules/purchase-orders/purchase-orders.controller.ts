import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PurchaseOrdersService } from './purchase-orders.service';
import { UpdatePurchaseOrderDto } from './dtos/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dtos/query-purchase-order.dto';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { BranchContext } from '../../common/decorators/branch-context.decorator';

@Controller('purchase-orders')
@UseGuards(AuthGuard('jwt'))
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

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
    return this.purchaseOrdersService.update(id, updatePurchaseOrderDto, branchId, companyId);
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
