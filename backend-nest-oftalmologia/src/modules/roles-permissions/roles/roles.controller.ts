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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { QueryRoleDto } from './dtos/query-role.dto';
import { CompanyId } from '../../../common/decorators/company-id.decorator';
@Controller('roles')
@UseGuards(AuthGuard('jwt'))
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}
  @Post('create')
  async create(@Body(ValidationPipe) createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }
  @Get('get-all')
  async findAll(
    @Query(ValidationPipe) queryDto: QueryRoleDto,
    @CompanyId() companyId: string | null
  ) {
    return this.rolesService.findAll(queryDto, companyId);
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }
  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateRoleDto: UpdateRoleDto
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }
  @Delete('delete/:id')
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
