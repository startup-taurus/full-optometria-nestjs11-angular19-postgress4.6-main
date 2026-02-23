import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ChangeStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  isSent: boolean;
}
