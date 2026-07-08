import type {
  TutorialContext,
  TutorialStep,
} from '@core/interfaces/ui/tutorial.interface'

export function buildMainFlowSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  return [
    {
      route: '/patients',
      awaitSelector: '[data-tour="patient-create"]',
      mockTarget: 'patients',
      popover: {
        title: t('TUTORIALS.MAIN_FLOW.STEP_WELCOME_TITLE'),
        description: t('TUTORIALS.MAIN_FLOW.STEP_WELCOME_TEXT'),
      },
    },
    {
      element: '[data-tour="patient-create"]',
      popover: {
        title: t('TUTORIALS.MAIN_FLOW.STEP_PATIENT_TITLE'),
        description: t('TUTORIALS.MAIN_FLOW.STEP_PATIENT_TEXT'),
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="patient-table"]',
      popover: {
        title: t('TUTORIALS.MAIN_FLOW.STEP_PATIENT_LIST_TITLE'),
        description: t('TUTORIALS.MAIN_FLOW.STEP_PATIENT_LIST_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
    {
      route: '/shift-management',
      awaitSelector: '[data-tour="shift-create"]',
      mockTarget: 'shifts',
      element: '[data-tour="shift-create"]',
      popover: {
        title: t('TUTORIALS.MAIN_FLOW.STEP_SHIFT_TITLE'),
        description: t('TUTORIALS.MAIN_FLOW.STEP_SHIFT_TEXT'),
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="shift-list"]',
      popover: {
        title: t('TUTORIALS.MAIN_FLOW.STEP_SHIFT_LIST_TITLE'),
        description: t('TUTORIALS.MAIN_FLOW.STEP_SHIFT_LIST_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
    {
      route: '/medical-history',
      awaitSelector: '[data-tour="history-create"]',
      mockTarget: 'medical-history',
      element: '[data-tour="history-create"]',
      popover: {
        title: t('TUTORIALS.MAIN_FLOW.STEP_HISTORY_TITLE'),
        description: t('TUTORIALS.MAIN_FLOW.STEP_HISTORY_TEXT'),
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="history-table"]',
      popover: {
        title: t('TUTORIALS.MAIN_FLOW.STEP_HISTORY_LIST_TITLE'),
        description: t('TUTORIALS.MAIN_FLOW.STEP_HISTORY_LIST_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
    {
      primarySelector: '[data-tour="history-lab-order"]',
      fallbackSelector: '[data-tour="history-table"]',
      popover: {
        title: t('TUTORIALS.MAIN_FLOW.STEP_LAB_TITLE'),
        description: t('TUTORIALS.MAIN_FLOW.STEP_LAB_TEXT'),
        side: 'left',
        align: 'center',
      },
    },
    {
      popover: {
        title: t('TUTORIALS.MAIN_FLOW.STEP_END_TITLE'),
        description: t('TUTORIALS.MAIN_FLOW.STEP_END_TEXT'),
      },
    },
  ]
}
