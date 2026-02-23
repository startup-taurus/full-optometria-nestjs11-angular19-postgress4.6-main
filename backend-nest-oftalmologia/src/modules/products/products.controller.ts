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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { QueryProductDto } from './dtos/query-product.dto';
import { PublicQueryProductDto } from './dtos/public-query-product.dto';
import { BranchContext } from '../../common/decorators/branch-context.decorator';
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
    @CompanyId() companyId: string | null
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
      branchId,
      companyId
    );
  }

  @Delete('delete/:id')
  @UseGuards(AuthGuard('jwt'))
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @BranchContext() branchId: string,
    @CompanyId() companyId: string | null
  ) {
    return this.productsService.remove(id, branchId, companyId);
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
}
