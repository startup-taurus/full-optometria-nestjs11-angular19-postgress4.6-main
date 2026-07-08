import type {
  TutorialContext,
  TutorialStep,
} from '@core/interfaces/ui/tutorial.interface'

function labIntro(): Pick<TutorialStep, 'route' | 'awaitSelector' | 'mockTarget'> {
  return {
    route: '/laboratory-orders',
    awaitSelector: '[data-tour="lab-list"]',
    mockTarget: 'laboratory-orders',
  }
}

export function buildLabTourSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  const rowStep = (key: string, primarySelector: string): TutorialStep => ({
    primarySelector,
    fallbackSelector: '[data-tour="lab-list"]',
    popover: {
      title: t(`TUTORIALS.LABORATORY.TOUR.${key}_TITLE`),
      description: t(`TUTORIALS.LABORATORY.TOUR.${key}_TEXT`),
      side: 'top',
      align: 'center',
    },
  })

  return [
    {
      ...labIntro(),
      element: '[data-tour="lab-header"]',
      popover: {
        title: t('TUTORIALS.LABORATORY.TOUR.INTRO_TITLE'),
        description: t('TUTORIALS.LABORATORY.TOUR.INTRO_TEXT'),
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="lab-list"]',
      popover: {
        title: t('TUTORIALS.LABORATORY.TOUR.LIST_TITLE'),
        description: t('TUTORIALS.LABORATORY.TOUR.LIST_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
    rowStep('VIEW', '[data-tour="lab-view"]'),
    rowStep('PURCHASE_ORDER', '[data-tour="lab-purchase-order"]'),
    rowStep('EDIT', '[data-tour="lab-edit"]'),
    rowStep('DELETE', '[data-tour="lab-delete"]'),
    rowStep('STATUS', '[data-tour="lab-status"]'),
    rowStep('WHATSAPP', '[data-tour="lab-whatsapp"]'),
    rowStep('EMAIL', '[data-tour="lab-email"]'),
    rowStep('PRINT', '[data-tour="lab-print"]'),
  ]
}
