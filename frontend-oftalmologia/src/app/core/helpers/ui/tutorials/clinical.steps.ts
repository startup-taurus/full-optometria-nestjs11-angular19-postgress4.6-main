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

const LAB_MODAL = 'app-laboratory-order-upsert-modal'
const LAB_NEXT = `${LAB_MODAL} .modal-footer .btn-primary`
const LAB_SAMPLE_DELIVERY_DATE = '2026-12-31'

export function buildHistoryLabOrderSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate

  const labField = (
    stepSelector: string,
    name: string,
    key: string
  ): TutorialStep => ({
    element: `${stepSelector} [formcontrolname="${name}"]`,
    awaitSelector: `${stepSelector} [formcontrolname="${name}"]`,
    popover: {
      title: t(`TUTORIALS.CLINICAL.LAB_ORDER.${key}_TITLE`),
      description: t(`TUTORIALS.CLINICAL.LAB_ORDER.${key}_TEXT`),
      side: 'right',
      align: 'start',
    },
  })

  return [
    {
      ...historyIntro(),
      primarySelector: '[data-tour="history-lab-order"]',
      fallbackSelector: '[data-tour="history-table"]',
      closeModal: true,
      popover: {
        title: t('TUTORIALS.CLINICAL.LAB_ORDER.OPEN_TITLE'),
        description: t('TUTORIALS.CLINICAL.LAB_ORDER.OPEN_TEXT'),
        side: 'left',
        align: 'center',
      },
    },
    {
      element: `app-laboratory-order-step1 [formcontrolname="clientId"]`,
      openModalTrigger: '[data-tour="history-lab-order"]',
      awaitSelector: `app-laboratory-order-step1 [formcontrolname="clientId"]`,
      popover: {
        title: t('TUTORIALS.CLINICAL.LAB_ORDER.F_CLIENT_TITLE'),
        description: t('TUTORIALS.CLINICAL.LAB_ORDER.F_CLIENT_TEXT'),
        side: 'bottom',
        align: 'start',
      },
    },
    labField('app-laboratory-order-step1', 'attendanceDate', 'F_ATTENDANCE'),
    {
      element: `app-laboratory-order-step1 [formcontrolname="deliveryDate"]`,
      awaitSelector: `app-laboratory-order-step1 [formcontrolname="deliveryDate"]`,
      popover: {
        title: t('TUTORIALS.CLINICAL.LAB_ORDER.F_DELIVERY_TITLE'),
        description: t('TUTORIALS.CLINICAL.LAB_ORDER.F_DELIVERY_TEXT'),
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: `app-laboratory-order-step2 [formcontrolname="odSphere"]`,
      fillFields: [
        {
          selector: `app-laboratory-order-step1 [formcontrolname="deliveryDate"]`,
          value: LAB_SAMPLE_DELIVERY_DATE,
        },
      ],
      clickTriggers: [LAB_NEXT],
      awaitSelector: `app-laboratory-order-step2 [formcontrolname="odSphere"]`,
      popover: {
        title: t('TUTORIALS.CLINICAL.LAB_ORDER.F_OD_TITLE'),
        description: t('TUTORIALS.CLINICAL.LAB_ORDER.F_OD_TEXT'),
        side: 'right',
        align: 'start',
      },
    },
    labField('app-laboratory-order-step2', 'oiSphere', 'F_OI'),
    {
      element: `app-laboratory-order-step3 [formcontrolname="frameHorizontal"]`,
      clickTriggers: [LAB_NEXT],
      awaitSelector: `app-laboratory-order-step3 [formcontrolname="frameHorizontal"]`,
      popover: {
        title: t('TUTORIALS.CLINICAL.LAB_ORDER.F_FRAME_TITLE'),
        description: t('TUTORIALS.CLINICAL.LAB_ORDER.F_FRAME_TEXT'),
        side: 'right',
        align: 'start',
      },
    },
    labField('app-laboratory-order-step3', 'observations', 'F_OBSERVATIONS'),
    {
      element: `app-laboratory-order-step4 [formcontrolname="productIds"]`,
      clickTriggers: [LAB_NEXT],
      awaitSelector: `app-laboratory-order-step4 [formcontrolname="productIds"]`,
      popover: {
        title: t('TUTORIALS.CLINICAL.LAB_ORDER.F_PRODUCTS_TITLE'),
        description: t('TUTORIALS.CLINICAL.LAB_ORDER.F_PRODUCTS_TEXT'),
        side: 'top',
        align: 'start',
      },
    },
    {
      element: LAB_NEXT,
      awaitSelector: LAB_NEXT,
      popover: {
        title: t('TUTORIALS.CLINICAL.LAB_ORDER.CLOSING_TITLE'),
        description: t('TUTORIALS.CLINICAL.LAB_ORDER.CLOSING_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
  ]
}
