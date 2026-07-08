import type {
  TutorialContext,
  TutorialStep,
} from '@core/interfaces/ui/tutorial.interface'

function purchaseOrdersIntro(): Pick<TutorialStep, 'route' | 'awaitSelector'> {
  return {
    route: '/purchase-orders',
    awaitSelector: '[data-tour="po-list"]',
  }
}

export function buildPurchaseOrderTourSteps(
  context: TutorialContext
): TutorialStep[] {
  const t = context.translate

  return [
    {
      ...purchaseOrdersIntro(),
      element: '[data-tour="po-header"]',
      popover: {
        title: t('TUTORIALS.PURCHASE_ORDER.TOUR.INTRO_TITLE'),
        description: t('TUTORIALS.PURCHASE_ORDER.TOUR.INTRO_TEXT'),
        side: 'bottom',
        align: 'start',
      },
    },
    {
      primarySelector: '[data-tour="po-summary"]',
      fallbackSelector: '[data-tour="po-list"]',
      popover: {
        title: t('TUTORIALS.PURCHASE_ORDER.TOUR.SUMMARY_TITLE'),
        description: t('TUTORIALS.PURCHASE_ORDER.TOUR.SUMMARY_TEXT'),
        side: 'bottom',
        align: 'center',
      },
    },
    {
      primarySelector: '[data-tour="po-reload"]',
      fallbackSelector: '[data-tour="po-list"]',
      popover: {
        title: t('TUTORIALS.PURCHASE_ORDER.TOUR.TOOLS_TITLE'),
        description: t('TUTORIALS.PURCHASE_ORDER.TOUR.TOOLS_TEXT'),
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="po-list"]',
      popover: {
        title: t('TUTORIALS.PURCHASE_ORDER.TOUR.LIST_TITLE'),
        description: t('TUTORIALS.PURCHASE_ORDER.TOUR.LIST_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="po-list"]',
      popover: {
        title: t('TUTORIALS.PURCHASE_ORDER.TOUR.ACTIONS_TITLE'),
        description: t('TUTORIALS.PURCHASE_ORDER.TOUR.ACTIONS_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="po-list"]',
      popover: {
        title: t('TUTORIALS.PURCHASE_ORDER.TOUR.BILLING_TITLE'),
        description: t('TUTORIALS.PURCHASE_ORDER.TOUR.BILLING_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="po-header"]',
      popover: {
        title: t('TUTORIALS.PURCHASE_ORDER.TOUR.ORIGIN_TITLE'),
        description: t('TUTORIALS.PURCHASE_ORDER.TOUR.ORIGIN_TEXT'),
        side: 'bottom',
        align: 'start',
      },
    },
  ]
}
