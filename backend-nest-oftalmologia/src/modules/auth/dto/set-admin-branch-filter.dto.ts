import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class SetAdminBranchFilterDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  branchId: string;
}