import type {
  TutorialContext,
  TutorialStep,
} from '@core/interfaces/ui/tutorial.interface'
import { buildCreateModalTour } from './modal-steps.helper'

function patientsIntro(): Pick<TutorialStep, 'route' | 'awaitSelector' | 'mockTarget'> {
  return {
    route: '/patients',
    awaitSelector: '[data-tour="patient-table"]',
    mockTarget: 'patients',
  }
}

export function buildPatientTourSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  const rowStep = (key: string, primarySelector: string): TutorialStep => ({
    primarySelector,
    fallbackSelector: '[data-tour="patient-table"]',
    popover: {
      title: t(`TUTORIALS.PATIENT.TOUR.${key}_TITLE`),
      description: t(`TUTORIALS.PATIENT.TOUR.${key}_TEXT`),
      side: 'left',
      align: 'center',
    },
  })

  return [
    {
      ...patientsIntro(),
      popover: {
        title: t('TUTORIALS.PATIENT.TOUR.INTRO_TITLE'),
        description: t('TUTORIALS.PATIENT.TOUR.INTRO_TEXT'),
      },
    },
    {
      element: '[data-tour="patient-create"]',
      popover: {
        title: t('TUTORIALS.PATIENT.TOUR.CREATE_TITLE'),
        description: t('TUTORIALS.PATIENT.TOUR.CREATE_TEXT'),
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="patient-table"]',
      popover: {
        title: t('TUTORIALS.PATIENT.TOUR.TABLE_TITLE'),
        description: t('TUTORIALS.PATIENT.TOUR.TABLE_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
    rowStep('HISTORY', '[data-tour="patient-history"]'),
    rowStep('VIEW_HISTORY', '[data-tour="patient-view-history"]'),
    rowStep('EDIT', '[data-tour="patient-edit"]'),
    rowStep('DELETE', '[data-tour="patient-delete"]'),
    {
      element: '[data-tour="patient-export"]',
      popover: {
        title: t('TUTORIALS.PATIENT.TOUR.EXPORT_TITLE'),
        description: t('TUTORIALS.PATIENT.TOUR.EXPORT_TEXT'),
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="patient-reload"]',
      popover: {
        title: t('TUTORIALS.PATIENT.TOUR.RELOAD_TITLE'),
        description: t('TUTORIALS.PATIENT.TOUR.RELOAD_TEXT'),
        side: 'bottom',
        align: 'end',
      },
    },
  ]
}

export function buildPatientCreateSteps(context: TutorialContext): TutorialStep[] {
  return buildCreateModalTour(context, {
    route: '/patients',
    mockTarget: 'patients',
    createTrigger: '[data-tour="patient-create"]',
    modalRoot: 'app-patient-form-modal',
    openTitleKey: 'TUTORIALS.PATIENT.CREATE.OPEN_TITLE',
    openTextKey: 'TUTORIALS.PATIENT.CREATE.OPEN_TEXT',
    closingTitleKey: 'TUTORIALS.PATIENT.CREATE.CLOSING_TITLE',
    closingTextKey: 'TUTORIALS.PATIENT.CREATE.CLOSING_TEXT',
    fields: [
      { selector: '[formControlName="firstName"]', titleKey: 'TUTORIALS.PATIENT.CREATE.F_FIRSTNAME_TITLE', textKey: 'TUTORIALS.PATIENT.CREATE.F_FIRSTNAME_TEXT' },
      { selector: '[formControlName="lastName"]', titleKey: 'TUTORIALS.PATIENT.CREATE.F_LASTNAME_TITLE', textKey: 'TUTORIALS.PATIENT.CREATE.F_LASTNAME_TEXT' },
      { selector: '[formControlName="documentNumber"]', titleKey: 'TUTORIALS.PATIENT.CREATE.F_DOCUMENT_TITLE', textKey: 'TUTORIALS.PATIENT.CREATE.F_DOCUMENT_TEXT' },
      { selector: '[formControlName="emailLocalPart"]', titleKey: 'TUTORIALS.PATIENT.CREATE.F_EMAIL_TITLE', textKey: 'TUTORIALS.PATIENT.CREATE.F_EMAIL_TEXT' },
      { selector: '[formControlName="mobilePhone"]', titleKey: 'TUTORIALS.PATIENT.CREATE.F_PHONE_TITLE', textKey: 'TUTORIALS.PATIENT.CREATE.F_PHONE_TEXT' },
    ],
  })
}

export function buildPatientEditSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  return [
    {
      ...patientsIntro(),
      element: '[data-tour="patient-edit"]',
      popover: {
        title: t('TUTORIALS.PATIENT.EDIT.STEP_1_TITLE'),
        description: t('TUTORIALS.PATIENT.EDIT.STEP_1_TEXT'),
        side: 'left',
        align: 'center',
      },
    },
  ]
}

export function buildPatientDeleteSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  return [
    {
      ...patientsIntro(),
      element: '[data-tour="patient-delete"]',
      popover: {
        title: t('TUTORIALS.PATIENT.DELETE.STEP_1_TITLE'),
        description: t('TUTORIALS.PATIENT.DELETE.STEP_1_TEXT'),
        side: 'left',
        align: 'center',
      },
    },
  ]
}

export function buildPatientHistorySteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  return [
    {
      ...patientsIntro(),
      element: '[data-tour="patient-history"]',
      popover: {
        title: t('TUTORIALS.PATIENT.HISTORY.STEP_1_TITLE'),
        description: t('TUTORIALS.PATIENT.HISTORY.STEP_1_TEXT'),
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '[data-tour="patient-view-history"]',
      popover: {
        title: t('TUTORIALS.PATIENT.HISTORY.STEP_2_TITLE'),
        description: t('TUTORIALS.PATIENT.HISTORY.STEP_2_TEXT'),
        side: 'left',
        align: 'center',
      },
    },
  ]
}

export function buildPatientFilterSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  return [
    {
      ...patientsIntro(),
      element: '[data-tour="patient-export"]',
      popover: {
        title: t('TUTORIALS.PATIENT.FILTER.STEP_1_TITLE'),
        description: t('TUTORIALS.PATIENT.FILTER.STEP_1_TEXT'),
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="patient-reload"]',
      popover: {
        title: t('TUTORIALS.PATIENT.FILTER.STEP_2_TITLE'),
        description: t('TUTORIALS.PATIENT.FILTER.STEP_2_TEXT'),
        side: 'bottom',
        align: 'end',
      },
    },
  ]
}
