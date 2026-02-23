import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { FilesService } from './files.service';
import { UploadFileDto } from './dtos/upload-file.dto';
import { QueryFileDto } from './dtos/query-file.dto';

@Controller('files')
@UseGuards(AuthGuard('jwt'))
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body(ValidationPipe) uploadFileDto: UploadFileDto
  ) {
    return this.filesService.uploadFile(file, uploadFileDto);
  }

  @Get()
  async findAll(@Query(ValidationPipe) queryFileDto: QueryFileDto) {
    return this.filesService.findAll(queryFileDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.findOne(id);
  }

  @Get('entity/:entityType/:entityId')
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('fileCategory') fileCategory?: string
  ) {
    return this.filesService.findByEntity(entityType, entityId, fileCategory);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.remove(id);
  }

  @Post(':id/deactivate')
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.deactivateFile(id);
  }
}
