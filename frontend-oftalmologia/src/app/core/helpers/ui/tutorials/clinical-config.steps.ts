import type {
  TutorialContext,
  TutorialStep,
} from '@core/interfaces/ui/tutorial.interface'

const HEADER = '[data-tour="mhc-header"]'

type PopoverSide = 'top' | 'right' | 'bottom' | 'left'
type PopoverAlign = 'start' | 'center' | 'end'

export function buildClinicalConfigTourSteps(
  context: TutorialContext
): TutorialStep[] {
  const t = context.translate

  const step = (
    key: string,
    primarySelector: string,
    side: PopoverSide = 'bottom',
    align: PopoverAlign = 'center'
  ): TutorialStep => ({
    primarySelector,
    fallbackSelector: HEADER,
    popover: {
      title: t(`TUTORIALS.CLINICAL_CONFIG.TOUR.${key}_TITLE`),
      description: t(`TUTORIALS.CLINICAL_CONFIG.TOUR.${key}_TEXT`),
      side,
      align,
    },
  })

  return [
    {
      route: '/medical-history-configuration',
      awaitSelector: HEADER,
      element: HEADER,
      popover: {
        title: t('TUTORIALS.CLINICAL_CONFIG.TOUR.INTRO_TITLE'),
        description: t('TUTORIALS.CLINICAL_CONFIG.TOUR.INTRO_TEXT'),
        side: 'bottom',
        align: 'start',
      },
    },
    step('TABS', '[data-tour="mhc-tabs"]', 'bottom', 'start'),
    step('SECTION', '.mh-config-section .card-header', 'right', 'start'),
    step('FIELD', '.mh-config-field', 'right', 'start'),
    step('SAVE', '[data-tour="mhc-save"]', 'bottom', 'end'),
  ]
}
