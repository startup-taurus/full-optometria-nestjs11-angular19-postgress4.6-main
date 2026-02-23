import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShiftStatusService } from '../services/shift-status.service';
import { CreateShiftStatusDto } from '../dtos/create-shift-status.dto';
import { UpdateShiftStatusDto } from '../dtos/update-shift-status.dto';

@Controller('shift-management/shift-status')
@UseGuards(AuthGuard('jwt'))
export class ShiftStatusController {
  constructor(private readonly shiftStatusService: ShiftStatusService) {}

  @Post('create')
  async create(
    @Body(ValidationPipe) createShiftStatusDto: CreateShiftStatusDto
  ) {
    return this.shiftStatusService.create(createShiftStatusDto);
  }

  @Get('get-all')
  async findAll() {
    return this.shiftStatusService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.shiftStatusService.findOne(id);
  }

  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateShiftStatusDto: UpdateShiftStatusDto
  ) {
    return this.shiftStatusService.update(id, updateShiftStatusDto);
  }

  @Delete('delete/:id')
  async remove(@Param('id') id: string) {
    return this.shiftStatusService.remove(id);
  }
}
