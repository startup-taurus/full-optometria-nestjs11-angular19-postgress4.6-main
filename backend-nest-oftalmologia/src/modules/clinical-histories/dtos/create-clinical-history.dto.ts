import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  IsObject,
  IsBoolean,
} from 'class-validator';

export class CreateClinicalHistoryDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsOptional()
  @IsBoolean()
  fromShiftFlow?: boolean;

  @IsOptional()
  @IsUUID()
  sourceShiftId?: string;

  @IsOptional()
  @IsString()
  professionalName?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsBoolean()
  firstTime?: boolean;

  @IsOptional()
  @IsDateString()
  lastVisualExamDate?: Date;

  @IsOptional()
  @IsString()
  visionProblems?: string;

  @IsOptional()
  @IsString()
  generalHealth?: string;

  @IsOptional()
  @IsString()
  otherHealthProblems?: string;

  @IsOptional()
  @IsString()
  segmentAnterior?: string;

  @IsOptional()
  @IsString()
  segmentAnteriorOther?: string;

  // Lensometría RX anterior
  @IsOptional()
  @IsString()
  previousRxOd?: string;

  @IsOptional()
  @IsString()
  previousAddOd?: string;

  @IsOptional()
  @IsString()
  previousOdVl?: string;

  @IsOptional()
  @IsString()
  previousOdVp?: string;

  @IsOptional()
  @IsString()
  previousRxOi?: string;

  @IsOptional()
  @IsString()
  previousAddOi?: string;

  @IsOptional()
  @IsString()
  previousOiVl?: string;

  @IsOptional()
  @IsString()
  previousOiVp?: string;

  @IsOptional()
  @IsString()
  previousAo?: string;

  // Agudeza visual sin RX
  @IsOptional()
  @IsString()
  visualAcuityOdVl?: string;

  @IsOptional()
  @IsString()
  visualAcuityOdVp?: string;

  @IsOptional()
  @IsString()
  visualAcuityOiVl?: string;

  @IsOptional()
  @IsString()
  visualAcuityOiVp?: string;

  @IsOptional()
  @IsObject()
  motorTest?: {
    exophoria?: { applies: string; vl: string; vp: string };
    endophoria?: { applies: string; vl: string; vp: string };
    exotropia?: { applies: string; vl: string; vp: string };
    endotropia?: { applies: string; vl: string; vp: string };
    hyperphoria?: { applies: string; vl: string; vp: string };
    hypotropia?: { applies: string; vl: string; vp: string };
    alternating?: { applies: string; vl: string; vp: string };
    orthophoria?: { applies: string; vl: string; vp: string };
  };

  @IsOptional()
  @IsString()
  finalRxOdSphere?: string;

  @IsOptional()
  @IsString()
  finalRxOdCylinder?: string;

  @IsOptional()
  @IsString()
  finalRxOdAxis?: string;

  @IsOptional()
  @IsString()
  finalRxOdAdd?: string;

  @IsOptional()
  @IsString()
  finalRxOiSphere?: string;

  @IsOptional()
  @IsString()
  finalRxOiCylinder?: string;

  @IsOptional()
  @IsString()
  finalRxOiAxis?: string;

  @IsOptional()
  @IsString()
  finalRxOiAdd?: string;

  @IsOptional()
  @IsString()
  correctedAvOdVl?: string;

  @IsOptional()
  @IsString()
  correctedAvOdVp?: string;

  @IsOptional()
  @IsString()
  correctedAvOiVl?: string;

  @IsOptional()
  @IsString()
  correctedAvOiVp?: string;

  @IsOptional()
  @IsArray()
  lensTypes?: string[];

  @IsOptional()
  @IsArray()
  additionalTreatments?: string[];

  @IsOptional()
  @IsObject()
  pupillaryReflexes?: {
    photomotor?: { od: string; oi: string };
    consensual?: { od: string; oi: string };
    accommodative?: { od: string; oi: string };
  };

  @IsOptional()
  @IsString()
  ophthalmoscopyOd?: string;

  @IsOptional()
  @IsString()
  ophthalmoscopyOi?: string;

  @IsOptional()
  @IsObject()
  refractiveTests?: {
    keratometry?: { od: string; oi: string };
    autorefract?: { od: string; oi: string };
    refraction?: { od: string; oi: string };
    subjective?: { od: string; oi: string };
  };

  @IsOptional()
  @IsString()
  stereopsis?: string;

  @IsOptional()
  @IsString()
  worthTest?: string;

  @IsOptional()
  @IsString()
  ishihara?: string;

  @IsOptional()
  @IsString()
  otherNotes?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  disposition?: string;
}
