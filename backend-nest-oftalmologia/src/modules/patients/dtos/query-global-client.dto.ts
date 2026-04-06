import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { QueryClientDto } from './query-client.dto';

export class QueryGlobalClientDto extends QueryClientDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  hasPatientLink?: boolean;

  @IsOptional()
  @IsUUID('4')
  patientId?: string;
}
