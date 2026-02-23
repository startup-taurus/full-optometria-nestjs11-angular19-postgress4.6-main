import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @MinLength(2)
  moduleName: string;

  @IsOptional()
  @IsString()
  description?: string;
}
