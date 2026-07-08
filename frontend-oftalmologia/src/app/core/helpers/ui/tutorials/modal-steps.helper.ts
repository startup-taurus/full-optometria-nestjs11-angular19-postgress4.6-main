import type {
  TutorialContext,
  TutorialStep,
} from '@core/interfaces/ui/tutorial.interface'

export interface ModalFieldStep {
  selector: string
  titleKey: string
  textKey: string
}

export interface CreateModalTourConfig {
  route: string
  mockTarget: TutorialStep['mockTarget']
  createTrigger: string
  modalRoot: string
  openTitleKey: string
  openTextKey: string
  closingTitleKey: string
  closingTextKey: string
  fields: ModalFieldStep[]
}

export function buildCreateModalTour(
  context: TutorialContext,
  config: CreateModalTourConfig
): TutorialStep[] {
  const t = context.translate

  const openStep: TutorialStep = {
    route: config.route,
    mockTarget: config.mockTarget,
    element: config.createTrigger,
    closeModal: true,
    popover: {
      title: t(config.openTitleKey),
      description: t(config.openTextKey),
      side: 'bottom',
      align: 'center',
    },
  }

  const fieldSteps: TutorialStep[] = config.fields.map((field, index) => ({
    element: `${config.modalRoot} ${field.selector}`,
    awaitSelector: `${config.modalRoot} ${field.selector}`,
    ...(index === 0 ? { openModalTrigger: config.createTrigger } : {}),
    popover: {
      title: t(field.titleKey),
      description: t(field.textKey),
      side: 'right',
      align: 'start',
    },
  }))

  const closingStep: TutorialStep = {
    element: config.modalRoot,
    popover: {
      title: t(config.closingTitleKey),
      description: t(config.closingTextKey),
    },
  }

  return [openStep, ...fieldSteps, closingStep]
}
