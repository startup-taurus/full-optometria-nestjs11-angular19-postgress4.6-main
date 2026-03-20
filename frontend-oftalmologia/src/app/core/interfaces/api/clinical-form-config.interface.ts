export interface ClinicalFormConfig {
  id: string
  companyId?: string
  branchId: string
  configName: string
  fieldsConfig: FieldsConfig
  isActive: boolean
  version: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface FieldsConfig {
  sections: {
    [sectionName: string]: {
      visible: boolean
      fields: {
        [fieldName: string]: boolean
      }
    }
  }
}

export interface CreateClinicalFormConfigDto {
  configName: string
  fieldsConfig: FieldsConfig
  isActive?: boolean
  version?: number
}

export interface UpdateClinicalFormConfigDto
  extends Partial<CreateClinicalFormConfigDto> {}

export const DEFAULT_CLINICAL_FORM_STRUCTURE: FieldsConfig = {
  sections: {
    step1_personalData: {
      visible: true,
      fields: {
        occupation: true,
        lastVisualExamDate: true,
        visionProblems: true,
        generalHealth: true,
        otherHealthProblems: true,
        segmentAnterior: true,
      },
    },

    step2_previousRx: {
      visible: true,
      fields: {
        previousRxOd: true,
        previousAddOd: true,
        previousOdVl: true,
        previousOdVp: true,
        previousRxOi: true,
        previousAddOi: true,
        previousOiVl: true,
        previousOiVp: true,
        previousAo: true,
      },
    },
    step2_visualAcuity: {
      visible: true,
      fields: {
        visualAcuityOdVl: true,
        visualAcuityOdVp: true,
        visualAcuityOiVl: true,
        visualAcuityOiVp: true,
      },
    },
    step2_motorTest: {
      visible: true,
      fields: {
        exophoria: true,
        endophoria: true,
        exotropia: true,
        endotropia: true,
        hyperphoria: true,
        hypotropia: true,
        alternating: true,
      },
    },
    step2_finalRx: {
      visible: true,
      fields: {
        finalRxOdSphere: true,
        finalRxOdCylinder: true,
        finalRxOdAxis: true,
        finalRxOdAdd: true,
        finalRxOdAvVl: true,
        finalRxOdAvVp: true,
        finalRxOiSphere: true,
        finalRxOiCylinder: true,
        finalRxOiAxis: true,
        finalRxOiAdd: true,
        finalRxOiAvVl: true,
        finalRxOiAvVp: true,
      },
    },
    step2_lensTypes: {
      visible: true,
      fields: {
        lensTypes: true,
      },
    },
    step2_additionalTreatments: {
      visible: true,
      fields: {
        additionalTreatments: true,
      },
    },
    step2_professionalName: {
      visible: true,
      fields: {
        professionalName: true,
      },
    },

    step3_pupillaryReflexes: {
      visible: true,
      fields: {
        photomotor: true,
        consensual: true,
        accommodative: true,
      },
    },
    step3_ophthalmoscopy: {
      visible: true,
      fields: {
        ophthalmoscopyOd: true,
        ophthalmoscopyOi: true,
      },
    },
    step3_refractiveTests: {
      visible: true,
      fields: {
        keratometry: true,
        autorefract: true,
        refraction: true,
        subjective: true,
      },
    },
    step3_otherExams: {
      visible: true,
      fields: {
        stereopsis: true,
        worthTest: true,
        otherNotes: true,
      },
    },
    step3_diagnosisAndDisposition: {
      visible: true,
      fields: {
        diagnosis: true,
        disposition: true,
      },
    },
  },
}

export const CLINICAL_FORM_LABELS = {
  sections: {
    step1_personalData: 'Datos Personales y Antecedentes',

    step2_previousRx: 'Lensometría RX Anterior',
    step2_visualAcuity: 'Agudeza Visual sin RX',
    step2_motorTest: 'Test Motor',
    step2_finalRx: 'RX Final',
    step2_lensTypes: 'Tipos de Luna',
    step2_additionalTreatments: 'Agudeza Visual Corregida',
    step2_professionalName: 'Nombre Profesional',

    step3_pupillaryReflexes: 'Reflejos Pupilares',
    step3_ophthalmoscopy: 'Oftalmoscopia',
    step3_refractiveTests: 'Tests Refractivos',
    step3_otherExams: 'Otros Exámenes',
    step3_diagnosisAndDisposition: 'Diagnóstico y Disposición',
  },
  fields: {
    occupation: 'Ocupación/Actividad',
    lastVisualExamDate: 'Fecha último examen o primera vez',
    visionProblems: 'Molestias en visión',
    generalHealth: 'Salud general',
    otherHealthProblems: 'Otro problema de salud y medicamentos',
    segmentAnterior: 'Segmento anterior (OD/OI/A.O.)',

    previousRxOd: 'RX anterior OD',
    previousAddOd: 'ADD OD',
    previousOdVl: 'VL OD',
    previousOdVp: 'VP OD',
    previousRxOi: 'RX anterior OI',
    previousAddOi: 'ADD OI',
    previousOiVl: 'VL OI',
    previousOiVp: 'VP OI',
    previousAo: 'AO',

    visualAcuityOdVl: 'OD VL',
    visualAcuityOdVp: 'OD VP',
    visualAcuityOiVl: 'OI VL',
    visualAcuityOiVp: 'OI VP',

    exophoria: 'Exoforia',
    endophoria: 'Endoforia',
    exotropia: 'Exotropia',
    endotropia: 'Endotropia',
    hyperphoria: 'Hiperforia',
    hypotropia: 'Hipertropia',
    alternating: 'Alternante',

    finalRxOdSphere: 'Esfera OD',
    finalRxOdCylinder: 'Cilindro OD',
    finalRxOdAxis: 'Eje OD',
    finalRxOdAdd: 'ADD OD',
    finalRxOdAvVl: 'AV VL OD',
    finalRxOdAvVp: 'AV VP OD',
    finalRxOiSphere: 'Esfera OI',
    finalRxOiCylinder: 'Cilindro OI',
    finalRxOiAxis: 'Eje OI',
    finalRxOiAdd: 'ADD OI',
    finalRxOiAvVl: 'AV VL OI',
    finalRxOiAvVp: 'AV VP OI',

    lensTypes: 'Tipos de Luna',
    additionalTreatments: 'Agudeza Visual Corregida',
    professionalName: 'Nombre Profesional',

    // Step 3
    photomotor: 'Fotomotor (OD, OI)',
    consensual: 'Consensual (OD, OI)',
    accommodative: 'Acomodativo (OD, OI)',

    ophthalmoscopyOd: 'Oftalmoscopia OD',
    ophthalmoscopyOi: 'Oftalmoscopia OI',

    keratometry: 'Queratometría (OD, OI)',
    autorefract: 'Autorefract (OD, OI)',
    refraction: 'Refracción (OD, OI)',
    subjective: 'Subjetivo (OD, OI)',

    stereopsis: 'Estereopsis',
    worthTest: 'Worth',
    otherNotes: 'Otras notas',

    diagnosis: 'Diagnóstico',
    disposition: 'Disposición',
  },
  steps: {
    step1: 'Paso 1: Datos Generales del Paciente',
    step2: 'Paso 2: Mediciones y RX',
    step3: 'Paso 3: Diagnóstico y Exámenes',
  },
}
