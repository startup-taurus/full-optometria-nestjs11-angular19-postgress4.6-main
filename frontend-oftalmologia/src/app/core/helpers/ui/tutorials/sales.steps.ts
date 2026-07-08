import type {
  TutorialContext,
  TutorialStep,
} from '@core/interfaces/ui/tutorial.interface'
import { buildCreateModalTour } from './modal-steps.helper'

function clientsIntro(): Pick<TutorialStep, 'route' | 'awaitSelector' | 'mockTarget'> {
  return {
    route: '/clients',
    awaitSelector: '[data-tour="clients-table"]',
    mockTarget: 'clients',
  }
}

export function buildClientCreateSteps(context: TutorialContext): TutorialStep[] {
  return buildCreateModalTour(context, {
    route: '/clients',
    mockTarget: 'clients',
    createTrigger: '[data-tour="clients-create"]',
    modalRoot: 'app-client-modal',
    openTitleKey: 'TUTORIALS.CLIENT.CREATE.OPEN_TITLE',
    openTextKey: 'TUTORIALS.CLIENT.CREATE.OPEN_TEXT',
    closingTitleKey: 'TUTORIALS.CLIENT.CREATE.CLOSING_TITLE',
    closingTextKey: 'TUTORIALS.CLIENT.CREATE.CLOSING_TEXT',
    fields: [
      { selector: '[formControlName="firstName"]', titleKey: 'TUTORIALS.CLIENT.CREATE.F_FIRSTNAME_TITLE', textKey: 'TUTORIALS.CLIENT.CREATE.F_FIRSTNAME_TEXT' },
      { selector: '[formControlName="lastName"]', titleKey: 'TUTORIALS.CLIENT.CREATE.F_LASTNAME_TITLE', textKey: 'TUTORIALS.CLIENT.CREATE.F_LASTNAME_TEXT' },
      { selector: '[formControlName="documentNumber"]', titleKey: 'TUTORIALS.CLIENT.CREATE.F_DOCUMENT_TITLE', textKey: 'TUTORIALS.CLIENT.CREATE.F_DOCUMENT_TEXT' },
      { selector: '[formControlName="email"]', titleKey: 'TUTORIALS.CLIENT.CREATE.F_EMAIL_TITLE', textKey: 'TUTORIALS.CLIENT.CREATE.F_EMAIL_TEXT' },
      { selector: '[formControlName="mobilePhone"]', titleKey: 'TUTORIALS.CLIENT.CREATE.F_PHONE_TITLE', textKey: 'TUTORIALS.CLIENT.CREATE.F_PHONE_TEXT' },
    ],
  })
}
