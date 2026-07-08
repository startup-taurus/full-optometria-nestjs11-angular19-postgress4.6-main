import type {
  TutorialContext,
  TutorialStep,
} from '@core/interfaces/ui/tutorial.interface'
import { buildCreateModalTour } from './modal-steps.helper'

function usersIntro(): Pick<TutorialStep, 'route' | 'awaitSelector' | 'mockTarget'> {
  return {
    route: '/users-management/users',
    awaitSelector: '[data-tour="users-table"]',
    mockTarget: 'users',
  }
}

function branchesIntro(): Pick<TutorialStep, 'route' | 'awaitSelector' | 'mockTarget'> {
  return {
    route: '/branches',
    awaitSelector: '[data-tour="branches-list"]',
    mockTarget: 'branches',
  }
}

function rolesIntro(): Pick<TutorialStep, 'route' | 'awaitSelector' | 'mockTarget'> {
  return {
    route: '/system-management/roles-and-permissions',
    awaitSelector: '[data-tour="roles-list-container"]',
    mockTarget: 'roles',
  }
}

export function buildUserCreateSteps(context: TutorialContext): TutorialStep[] {
  return buildCreateModalTour(context, {
    route: '/users-management/users',
    mockTarget: 'users',
    createTrigger: '[data-tour="users-create"]',
    modalRoot: 'app-user-form-modal',
    openTitleKey: 'TUTORIALS.USER.CREATE.OPEN_TITLE',
    openTextKey: 'TUTORIALS.USER.CREATE.OPEN_TEXT',
    closingTitleKey: 'TUTORIALS.USER.CREATE.CLOSING_TITLE',
    closingTextKey: 'TUTORIALS.USER.CREATE.CLOSING_TEXT',
    fields: [
      { selector: '[formControlName="username"]', titleKey: 'TUTORIALS.USER.CREATE.F_USERNAME_TITLE', textKey: 'TUTORIALS.USER.CREATE.F_USERNAME_TEXT' },
      { selector: '[formControlName="email"]', titleKey: 'TUTORIALS.USER.CREATE.F_EMAIL_TITLE', textKey: 'TUTORIALS.USER.CREATE.F_EMAIL_TEXT' },
      { selector: '[formControlName="firstName"]', titleKey: 'TUTORIALS.USER.CREATE.F_FIRSTNAME_TITLE', textKey: 'TUTORIALS.USER.CREATE.F_FIRSTNAME_TEXT' },
      { selector: '[formControlName="lastName"]', titleKey: 'TUTORIALS.USER.CREATE.F_LASTNAME_TITLE', textKey: 'TUTORIALS.USER.CREATE.F_LASTNAME_TEXT' },
      { selector: '[formControlName="roleId"]', titleKey: 'TUTORIALS.USER.CREATE.F_ROLE_TITLE', textKey: 'TUTORIALS.USER.CREATE.F_ROLE_TEXT' },
      { selector: '[formControlName="branchId"]', titleKey: 'TUTORIALS.USER.CREATE.F_BRANCH_TITLE', textKey: 'TUTORIALS.USER.CREATE.F_BRANCH_TEXT' },
    ],
  })
}

export function buildRoleCreateSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  return [
    {
      ...rolesIntro(),
      element: '[data-tour="roles-create-menu"]',
      popover: {
        title: t('TUTORIALS.ROLE.CREATE.STEP_1_TITLE'),
        description: t('TUTORIALS.ROLE.CREATE.STEP_1_TEXT'),
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="roles-list-container"]',
      popover: {
        title: t('TUTORIALS.ROLE.CREATE.STEP_2_TITLE'),
        description: t('TUTORIALS.ROLE.CREATE.STEP_2_TEXT'),
        side: 'right',
        align: 'center',
      },
    },
  ]
}

export function buildBranchCreateSteps(context: TutorialContext): TutorialStep[] {
  return buildCreateModalTour(context, {
    route: '/branches',
    mockTarget: 'branches',
    createTrigger: '[data-tour="branches-create"]',
    modalRoot: 'app-branch-modal',
    openTitleKey: 'TUTORIALS.BRANCH.CREATE.OPEN_TITLE',
    openTextKey: 'TUTORIALS.BRANCH.CREATE.OPEN_TEXT',
    closingTitleKey: 'TUTORIALS.BRANCH.CREATE.CLOSING_TITLE',
    closingTextKey: 'TUTORIALS.BRANCH.CREATE.CLOSING_TEXT',
    fields: [
      { selector: '[formControlName="name"]', titleKey: 'TUTORIALS.BRANCH.CREATE.F_NAME_TITLE', textKey: 'TUTORIALS.BRANCH.CREATE.F_NAME_TEXT' },
      { selector: '[formControlName="code"]', titleKey: 'TUTORIALS.BRANCH.CREATE.F_CODE_TITLE', textKey: 'TUTORIALS.BRANCH.CREATE.F_CODE_TEXT' },
      { selector: '[formControlName="address"]', titleKey: 'TUTORIALS.BRANCH.CREATE.F_ADDRESS_TITLE', textKey: 'TUTORIALS.BRANCH.CREATE.F_ADDRESS_TEXT' },
      { selector: '[formControlName="city"]', titleKey: 'TUTORIALS.BRANCH.CREATE.F_CITY_TITLE', textKey: 'TUTORIALS.BRANCH.CREATE.F_CITY_TEXT' },
      { selector: '[formControlName="phone"]', titleKey: 'TUTORIALS.BRANCH.CREATE.F_PHONE_TITLE', textKey: 'TUTORIALS.BRANCH.CREATE.F_PHONE_TEXT' },
      { selector: '[formControlName="corporateEmail"]', titleKey: 'TUTORIALS.BRANCH.CREATE.F_EMAIL_TITLE', textKey: 'TUTORIALS.BRANCH.CREATE.F_EMAIL_TEXT' },
    ],
  })
}
