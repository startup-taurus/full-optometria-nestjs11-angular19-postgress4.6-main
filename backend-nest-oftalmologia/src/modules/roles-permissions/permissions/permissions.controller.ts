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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { QueryPermissionDto } from './dtos/query-permission.dto';
@Controller('permission')
@UseGuards(AuthGuard('jwt'))
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}
  @Post('create')
  async create(@Body(ValidationPipe) createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }
  @Get('get-all')
  async findAll(@Query(ValidationPipe) queryDto: QueryPermissionDto) {
    return this.permissionsService.findAll(queryDto);
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }
  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updatePermissionDto: UpdatePermissionDto
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }
  @Delete('delete/:id')
  async remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
