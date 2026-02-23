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
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dtos/create-module.dto';
import { UpdateModuleDto } from './dtos/update-module.dto';
import { QueryModuleDto } from './dtos/query-module.dto';
@Controller('module')
@UseGuards(AuthGuard('jwt'))
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}
  @Post('create')
  async create(@Body(ValidationPipe) createModuleDto: CreateModuleDto) {
    return this.modulesService.create(createModuleDto);
  }
  @Get('get-all')
  async findAll(@Query(ValidationPipe) queryDto: QueryModuleDto) {
    return this.modulesService.findAll(queryDto);
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }
  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateModuleDto: UpdateModuleDto
  ) {
    return this.modulesService.update(id, updateModuleDto);
  }
  @Delete('delete/:id')
  async remove(@Param('id') id: string) {
    return this.modulesService.remove(id);
  }
}
