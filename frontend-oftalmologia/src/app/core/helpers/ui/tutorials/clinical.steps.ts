import type {
  TutorialContext,
  TutorialStep,
} from '@core/interfaces/ui/tutorial.interface'

function historyIntro(): Pick<TutorialStep, 'route' | 'awaitSelector' | 'mockTarget'> {
  return {
    route: '/medical-history',
    awaitSelector: '[data-tour="history-table"]',
    mockTarget: 'medical-history',
  }
}

export function buildHistoryTourSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  const rowStep = (key: string, primarySelector: string): TutorialStep => ({
    primarySelector,
    fallbackSelector: '[data-tour="history-table"]',
    popover: {
      title: t(`TUTORIALS.CLINICAL.TOUR.${key}_TITLE`),
      description: t(`TUTORIALS.CLINICAL.TOUR.${key}_TEXT`),
      side: 'left',
      align: 'center',
    },
  })

  return [
    {
      ...historyIntro(),
      popover: {
        title: t('TUTORIALS.CLINICAL.TOUR.INTRO_TITLE'),
        description: t('TUTORIALS.CLINICAL.TOUR.INTRO_TEXT'),
      },
    },
    {
      element: '[data-tour="history-create"]',
      popover: {
        title: t('TUTORIALS.CLINICAL.TOUR.CREATE_TITLE'),
        description: t('TUTORIALS.CLINICAL.TOUR.CREATE_TEXT'),
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="history-table"]',
      popover: {
        title: t('TUTORIALS.CLINICAL.TOUR.TABLE_TITLE'),
        description: t('TUTORIALS.CLINICAL.TOUR.TABLE_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
    rowStep('EDIT', '[data-tour="history-edit"]'),
    rowStep('DUPLICATE', '[data-tour="history-duplicate"]'),
    rowStep('DELETE', '[data-tour="history-delete"]'),
    rowStep('LAB_ORDER', '[data-tour="history-lab-order"]'),
  ]
}

export function buildHistoryCreateSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  return [
    {
      ...historyIntro(),
      element: '[data-tour="history-create"]',
      popover: {
        title: t('TUTORIALS.CLINICAL.CREATE.STEP_1_TITLE'),
        description: t('TUTORIALS.CLINICAL.CREATE.STEP_1_TEXT'),
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="history-table"]',
      popover: {
        title: t('TUTORIALS.CLINICAL.CREATE.STEP_2_TITLE'),
        description: t('TUTORIALS.CLINICAL.CREATE.STEP_2_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
  ]
}

export function buildHistoryManageSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  return [
    {
      ...historyIntro(),
      primarySelector: '[data-tour="history-edit"]',
      fallbackSelector: '[data-tour="history-table"]',
      popover: {
        title: t('TUTORIALS.CLINICAL.MANAGE.STEP_1_TITLE'),
        description: t('TUTORIALS.CLINICAL.MANAGE.STEP_1_TEXT'),
        side: 'left',
        align: 'center',
      },
    },
    {
      primarySelector: '[data-tour="history-delete"]',
      fallbackSelector: '[data-tour="history-table"]',
      popover: {
        title: t('TUTORIALS.CLINICAL.MANAGE.STEP_2_TITLE'),
        description: t('TUTORIALS.CLINICAL.MANAGE.STEP_2_TEXT'),
        side: 'left',
        align: 'center',
      },
    },
  ]
}

export function buildHistoryLabOrderSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  return [
    {
      ...historyIntro(),
      primarySelector: '[data-tour="history-lab-order"]',
      fallbackSelector: '[data-tour="history-table"]',
      popover: {
        title: t('TUTORIALS.CLINICAL.LAB_ORDER.STEP_1_TITLE'),
        description: t('TUTORIALS.CLINICAL.LAB_ORDER.STEP_1_TEXT'),
        side: 'left',
        align: 'center',
      },
    },
  ]
}
