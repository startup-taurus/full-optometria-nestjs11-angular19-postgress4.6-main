import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateClinicalFormConfigDto {
  @IsString()
  @IsNotEmpty()
  configName: string;

  @IsObject()
  @IsNotEmpty()
  fieldsConfig: {
    sections: {
      [sectionName: string]: {
        visible: boolean;
        fields: {
          [fieldName: string]: boolean;
        };
      };
    };
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  version?: number;
}
