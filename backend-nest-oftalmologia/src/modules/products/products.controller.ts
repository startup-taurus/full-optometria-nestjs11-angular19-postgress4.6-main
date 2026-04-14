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
  ValidationPipe,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  ParseBoolPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Express } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { QueryProductDto } from './dtos/query-product.dto';
import { PublicQueryProductDto } from './dtos/public-query-product.dto';
import { TransferProductStockDto } from './dtos/transfer-product-stock.dto';
import { QueryProductTransferHistoryDto } from './dtos/query-product-transfer-history.dto';
import { QueryProductStockHistoryDto } from './dtos/query-product-stock-history.dto';
import { QueryProductHistoryDto } from './dtos/query-product-history.dto';
import { BranchContext } from '../../common/decorators/branch-context.decorator';
import { CreateApplyDiscountDto } from './dtos/create-apply-discount.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('public/catalog')
  async getPublicCatalog(
    @Query(ValidationPipe) queryDto: PublicQueryProductDto
  ) {
    return this.productsService.findAllPublic(queryDto);
  }

  @Get('public/filters')
  async getPublicFilters(
    @Query('companySlug') companySlug?: string,
    @Query('companyName') companyName?: string
  ) {
    return this.productsService.getPublicFilters(companySlug, companyName);
  }

  @Get('public/validate-company/:companySlug')
  async validateCompany(@Param('companySlug') companySlug: string) {
    return this.productsService.validateCompany(companySlug);
  }

  @Get('public/allowed-companies')
  async getAllowedCompanies() {
    return this.productsService.getAllowedCompanies();
  }

  @Get('public/:id')
  async getPublicProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOnePublic(id);
  }

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Body(ValidationPipe) createProductDto: CreateProductDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any
  ) {
    return this.productsService.create(
      createProductDto,
      branchId,
      companyId,
      user?.id
    );
  }

  @Get('get-all')
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query(ValidationPipe) queryDto: QueryProductDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.productsService.findAll(queryDto, branchId, companyId);
  }

  @Get('by-code/:code')
  @UseGuards(AuthGuard('jwt'))
  async findOneByCode(
    @Param('code') code: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.productsService.findOneByCode(code, branchId, companyId);
  }

  @Get('transfers/history')
  @UseGuards(AuthGuard('jwt'))
  async getTransferHistory(
    @Query(ValidationPipe) queryDto: QueryProductTransferHistoryDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.productsService.getTransferHistory(queryDto, branchId, companyId);
  }

  @Get('stock/history')
  @UseGuards(AuthGuard('jwt'))
  async getStockHistory(
    @Query(ValidationPipe) queryDto: QueryProductStockHistoryDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.productsService.getStockHistory(queryDto, branchId, companyId);
  }

  @Get('audit/history')
  @UseGuards(AuthGuard('jwt'))
  async getProductHistory(
    @Query(ValidationPipe) queryDto: QueryProductHistoryDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.productsService.getProductHistory(queryDto, branchId, companyId);
  }

  @Get('discounts/active')
  @UseGuards(AuthGuard('jwt'))
  async getActiveDiscounts(
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
  ) {
    return this.productsService.getActiveDiscounts(branchId, companyId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.productsService.findOne(id, branchId, companyId);
  }

  @Patch('update/:id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateProductDto: UpdateProductDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
      branchId,
      companyId,
      user?.id
    );
  }

  @Delete('delete/:id')
  @UseGuards(AuthGuard('jwt'))
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any
  ) {
    return this.productsService.remove(id, branchId, companyId, user?.id);
  }

  @Post(':id/upload-image')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image'))
  async uploadProductImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @BranchContext() branchId: string,
    @Body('isCover', new ParseBoolPipe({ optional: true })) isCover?: boolean
  ) {
    return this.productsService.uploadProductImage(
      id,
      file,
      branchId,
      isCover ?? true
    );
  }

  @Get(':id/images')
  @UseGuards(AuthGuard('jwt'))
  async getProductImages(
    @Param('id', ParseUUIDPipe) id: string,
    @BranchContext() branchId: string
  ) {
    return this.productsService.getProductImages(id, branchId);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(AuthGuard('jwt'))
  async deleteProductImage(
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @BranchContext() branchId: string
  ) {
    return this.productsService.deleteProductImage(
      productId,
      imageId,
      branchId
    );
  }

  @Post(':id/transfer-stock')
  @UseGuards(AuthGuard('jwt'))
  async transferStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) transferDto: TransferProductStockDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any
  ) {
    return this.productsService.transferStock(
      id,
      transferDto,
      branchId,
      companyId,
      user?.id
    );
  }

  @Post(':id/apply-discount')
  @UseGuards(AuthGuard('jwt'))
  async applyDiscount(
    @Param('id', ParseUUIDPipe) productId: string,
    @Body(ValidationPipe) dto: CreateApplyDiscountDto,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any
  ) {
    return this.productsService.applyDiscount(productId, branchId, companyId, dto, user?.id);
  }

  @Delete(':id/remove-discount')
  @UseGuards(AuthGuard('jwt'))
  async removeDiscount(
    @Param('id', ParseUUIDPipe) productId: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: any
  ) {
    return this.productsService.removeDiscount(productId, branchId, companyId, user?.id);
  }

}
