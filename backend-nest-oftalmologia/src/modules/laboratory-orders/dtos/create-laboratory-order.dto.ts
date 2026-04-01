import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsBoolean,
  Allow,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FrameType } from '../entities/laboratory-order.entity';

export class LaboratoryOrderLineItemDto {
  @Allow()
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @Allow()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateLaboratoryOrderDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsOptional()
  @IsUUID()
  clinicalHistoryId?: string;

  @IsOptional()
  @IsDateString()
  attendanceDate?: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  odSphere?: string;

  @IsOptional()
  @IsString()
  odCylinder?: string;

  @IsOptional()
  @IsString()
  odAxis?: string;

  @IsOptional()
  @IsString()
  odAdd?: string;

  @IsOptional()
  @IsString()
  odHeight?: string;

  @IsOptional()
  @IsString()
  odDnp?: string;

  @IsOptional()
  @IsString()
  oiSphere?: string;

  @IsOptional()
  @IsString()
  oiCylinder?: string;

  @IsOptional()
  @IsString()
  oiAxis?: string;

  @IsOptional()
  @IsString()
  oiAdd?: string;

  @IsOptional()
  @IsString()
  oiHeight?: string;

  @IsOptional()
  @IsString()
  oiDnp?: string;

  @IsOptional()
  @IsString()
  cbase?: string;

  @IsOptional()
  @IsString()
  sunDegree?: string;

  @IsOptional()
  @IsString()
  prism?: string;

  @IsOptional()
  @IsString()
  base?: string;

  @IsOptional()
  @IsString()
  dVertex?: string;

  @IsOptional()
  @IsString()
  pantos?: string;

  @IsOptional()
  @IsString()
  panora?: string;

  @IsOptional()
  @IsString()
  frameFit?: string;

  @IsOptional()
  @IsString()
  profile?: string;

  @IsOptional()
  @IsString()
  mid?: string;

  @IsOptional()
  @IsString()
  distVp?: string;

  @IsOptional()
  @IsString()
  engraving?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productIds?: string[];

  @IsOptional()
  @IsArray()
  @Allow()
  @ValidateNested({ each: true })
  @Type(() => LaboratoryOrderLineItemDto)
  lineItems?: LaboratoryOrderLineItemDto[];

  @IsOptional()
  @IsBoolean()
  @Allow()
  ignoreStockValidation?: boolean;

  @IsOptional()
  @IsEnum(FrameType)
  frameType?: FrameType;

  @IsOptional()
  @IsString()
  frameTypeDescription?: string;

  @IsOptional()
  @IsString()
  frameBrand?: string;

  @IsOptional()
  @IsString()
  frameModel?: string;

  @IsOptional()
  @IsString()
  frameData?: string;

  @IsOptional()
  @IsString()
  frameLargerDiameter?: string;

  @IsOptional()
  @IsString()
  frameHorizontal?: string;

  @IsOptional()
  @IsString()
  frameVertical?: string;

  @IsOptional()
  @IsString()
  frameBridge?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
