import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateCurrentPasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;
}
