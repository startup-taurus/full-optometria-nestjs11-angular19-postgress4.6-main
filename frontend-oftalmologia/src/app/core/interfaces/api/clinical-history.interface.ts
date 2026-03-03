import { Patient } from './patient.interface'

export interface ClinicalHistory {
  id: string
  branchId: string
  patientId: string
  professionalName?: string
  isSent: boolean
  occupation?: string
  firstTime?: boolean
  lastVisualExamDate?: Date | string
  visionProblems?: string
  generalHealth?: string
  otherHealthProblems?: string
  segmentAnterior?: string
  segmentAnteriorOther?: string

  previousRxOd?: string
  previousAddOd?: string
  previousRxOi?: string
  previousAddOi?: string

  visualAcuityOdVl?: string
  visualAcuityOdVp?: string
  visualAcuityOiVl?: string
  visualAcuityOiVp?: string

  motorTest?: {
    exophoria?: { applies: string; od: string; oi: string; value: string }
    endophoria?: { applies: string; od: string; oi: string; value: string }
    exotropia?: { applies: string; od: string; oi: string; value: string }
    endotropia?: { applies: string; od: string; oi: string; value: string }
    hyperphoria?: { applies: string; od: string; oi: string; value: string }
    hypotropia?: { applies: string; od: string; oi: string; value: string }
    alternating?: { applies: string; od: string; oi: string; value: string }
  }

  finalRxOdSphere?: string
  finalRxOdCylinder?: string
  finalRxOdAxis?: string
  finalRxOdAdd?: string
  finalRxOiSphere?: string
  finalRxOiCylinder?: string
  finalRxOiAxis?: string
  finalRxOiAdd?: string

  correctedAvOdVl?: string
  correctedAvOdVp?: string
  correctedAvOiVl?: string
  correctedAvOiVp?: string

  lensTypes?: string[]
  additionalTreatments?: string[]

  pupillaryReflexes?: {
    photomotor?: { od: string; oi: string }
    consensual?: { od: string; oi: string }
    accommodative?: { od: string; oi: string }
  }

  ophthalmoscopyOd?: string
  ophthalmoscopyOi?: string

  refractiveTests?: {
    keratometry?: { od: string; oi: string }
    autorefract?: { od: string; oi: string }
    refraction?: { od: string; oi: string }
    subjective?: { od: string; oi: string }
  }

  stereopsis?: string
  worthTest?: string
  otherNotes?: string
  diagnosis?: string
  disposition?: string

  createdAt: Date | string
  updatedAt: Date | string

  patient?: Patient
}

export interface CreateClinicalHistoryDto {
  patientId: string
  fromShiftFlow?: boolean
  sourceShiftId?: string
  professionalName?: string
  occupation?: string
  firstTime?: boolean
  lastVisualExamDate?: Date | string
  visionProblems?: string
  generalHealth?: string
  otherHealthProblems?: string
  segmentAnterior?: string
  segmentAnteriorOther?: string

  previousRxOd?: string
  previousAddOd?: string
  previousRxOi?: string
  previousAddOi?: string

  visualAcuityOdVl?: string
  visualAcuityOdVp?: string
  visualAcuityOiVl?: string
  visualAcuityOiVp?: string

  motorTest?: {
    exophoria?: { applies: string; od: string; oi: string; value: string }
    endophoria?: { applies: string; od: string; oi: string; value: string }
    exotropia?: { applies: string; od: string; oi: string; value: string }
    endotropia?: { applies: string; od: string; oi: string; value: string }
    hyperphoria?: { applies: string; od: string; oi: string; value: string }
    hypotropia?: { applies: string; od: string; oi: string; value: string }
    alternating?: { applies: string; od: string; oi: string; value: string }
  }

  finalRxOdSphere?: string
  finalRxOdCylinder?: string
  finalRxOdAxis?: string
  finalRxOdAdd?: string
  finalRxOiSphere?: string
  finalRxOiCylinder?: string
  finalRxOiAxis?: string
  finalRxOiAdd?: string

  correctedAvOdVl?: string
  correctedAvOdVp?: string
  correctedAvOiVl?: string
  correctedAvOiVp?: string

  lensTypes?: string[]
  additionalTreatments?: string[]

  pupillaryReflexes?: {
    photomotor?: { od: string; oi: string }
    consensual?: { od: string; oi: string }
    accommodative?: { od: string; oi: string }
  }

  ophthalmoscopyOd?: string
  ophthalmoscopyOi?: string

  refractiveTests?: {
    keratometry?: { od: string; oi: string }
    autorefract?: { od: string; oi: string }
    refraction?: { od: string; oi: string }
    subjective?: { od: string; oi: string }
  }

  stereopsis?: string
  worthTest?: string
  otherNotes?: string
  diagnosis?: string
  disposition?: string
}

export interface UpdateClinicalHistoryDto
  extends Partial<CreateClinicalHistoryDto> {}

export interface ClinicalHistoryQueryParams {
  page?: number
  limit?: number
  patientId?: string
  isSent?: boolean
  startDate?: string
  endDate?: string
  search?: string
  branchId?: string
}

export interface ChangeStatusDto {
  isSent: boolean
}
