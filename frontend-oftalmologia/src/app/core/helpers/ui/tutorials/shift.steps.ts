import type {
  TutorialContext,
  TutorialStep,
} from '@core/interfaces/ui/tutorial.interface'
import { buildCreateModalTour } from './modal-steps.helper'

function shiftsIntro(): Pick<TutorialStep, 'route' | 'awaitSelector' | 'mockTarget'> {
  return {
    route: '/shift-management',
    awaitSelector: '[data-tour="shift-list"]',
    mockTarget: 'shifts',
  }
}

export function buildShiftCreateSteps(context: TutorialContext): TutorialStep[] {
  return buildCreateModalTour(context, {
    route: '/shift-management',
    mockTarget: 'shifts',
    createTrigger: '[data-tour="shift-create"]',
    modalRoot: 'app-shift-modal',
    openTitleKey: 'TUTORIALS.SHIFT.CREATE.OPEN_TITLE',
    openTextKey: 'TUTORIALS.SHIFT.CREATE.OPEN_TEXT',
    closingTitleKey: 'TUTORIALS.SHIFT.CREATE.CLOSING_TITLE',
    closingTextKey: 'TUTORIALS.SHIFT.CREATE.CLOSING_TEXT',
    fields: [
      { selector: '[formControlName="patientId"]', titleKey: 'TUTORIALS.SHIFT.CREATE.F_PATIENT_TITLE', textKey: 'TUTORIALS.SHIFT.CREATE.F_PATIENT_TEXT' },
      { selector: '#appointmentDate', titleKey: 'TUTORIALS.SHIFT.CREATE.F_DATE_TITLE', textKey: 'TUTORIALS.SHIFT.CREATE.F_DATE_TEXT' },
      { selector: '#description', titleKey: 'TUTORIALS.SHIFT.CREATE.F_DESCRIPTION_TITLE', textKey: 'TUTORIALS.SHIFT.CREATE.F_DESCRIPTION_TEXT' },
    ],
  })
}

export function buildShiftManageSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  return [
    {
      ...shiftsIntro(),
      primarySelector: '[data-tour="shift-edit"]',
      fallbackSelector: '[data-tour="shift-list"]',
      popover: {
        title: t('TUTORIALS.SHIFT.MANAGE.STEP_1_TITLE'),
        description: t('TUTORIALS.SHIFT.MANAGE.STEP_1_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
    {
      primarySelector: '[data-tour="shift-status"]',
      fallbackSelector: '[data-tour="shift-list"]',
      popover: {
        title: t('TUTORIALS.SHIFT.MANAGE.STEP_2_TITLE'),
        description: t('TUTORIALS.SHIFT.MANAGE.STEP_2_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
    {
      primarySelector: '[data-tour="shift-delete"]',
      fallbackSelector: '[data-tour="shift-list"]',
      popover: {
        title: t('TUTORIALS.SHIFT.MANAGE.STEP_3_TITLE'),
        description: t('TUTORIALS.SHIFT.MANAGE.STEP_3_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
  ]
}

export function buildShiftHistorySteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  return [
    {
      ...shiftsIntro(),
      primarySelector: '[data-tour="shift-create-history"]',
      fallbackSelector: '[data-tour="shift-list"]',
      popover: {
        title: t('TUTORIALS.SHIFT.HISTORY.STEP_1_TITLE'),
        description: t('TUTORIALS.SHIFT.HISTORY.STEP_1_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
  ]
}
