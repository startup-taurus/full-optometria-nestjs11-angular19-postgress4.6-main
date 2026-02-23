import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ChangeStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  isConfirmed: boolean;
}
