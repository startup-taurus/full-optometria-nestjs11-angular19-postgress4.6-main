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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UpdateCurrentUserDto } from './dtos/update-current-user.dto';
import { ValidateCurrentPasswordDto } from './dtos/validate-current-password.dto';
import { QueryUserDto } from './dtos/query-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { User } from './entities/user.entity';
@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post('create')
  async create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  @Get('get-all')
  async findAll(
    @Query() queryDto: QueryUserDto,
    @CompanyId() companyId: string | null
  ) {
    return this.usersService.findAll(queryDto, companyId);
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('update/current')
  @UseInterceptors(FileInterceptor('profilePhoto'))
  async updateCurrent(
    @CurrentUser() user: User,
    @Body(ValidationPipe) updateCurrentUserDto: UpdateCurrentUserDto,
    @UploadedFile() profilePhoto?: Express.Multer.File
  ) {
    try {
      const result = await this.usersService.updateCurrent(
        user.id,
        updateCurrentUserDto,
        profilePhoto
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post('validate-current-password')
  async validateCurrentPassword(
    @CurrentUser() user: User,
    @Body(ValidationPipe) validatePasswordDto: ValidateCurrentPasswordDto
  ) {
    return this.usersService.validateCurrentPassword(
      user.id,
      validatePasswordDto.currentPassword
    );
  }

  @Delete('delete/:id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('search')
  async searchUsers(@Query('q') query: string) {
    return this.usersService.searchUsers(query);
  }
}
