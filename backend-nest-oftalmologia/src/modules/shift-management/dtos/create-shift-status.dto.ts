import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateShiftStatusDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
