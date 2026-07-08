import type { DriveStep } from 'driver.js'

export type TutorialTag =
  | 'MAIN_FLOW'
  | 'PATIENTS'
  | 'SCHEDULING'
  | 'CLINICAL'
  | 'LABORATORY'
  | 'SALES'
  | 'CATALOG'
  | 'ADMIN'

export type TutorialMockTarget =
  | 'patients'
  | 'shifts'
  | 'medical-history'
  | 'laboratory-orders'
  | 'clients'
  | 'users'
  | 'suppliers'
  | 'inventory'
  | 'branches'
  | 'companies'
  | 'categories'
  | 'roles'

export interface TutorialMockable<T = unknown> {
  applyTutorialMock(rows: T[]): void
  clearTutorialMock(): void
}

export interface TutorialFieldFill {
  selector: string
  value: string
}

export interface TutorialStep extends DriveStep {
  route?: string
  queryParams?: Record<string, string>
  awaitSelector?: string
  primarySelector?: string
  fallbackSelector?: string
  mockTarget?: TutorialMockTarget
  openModalTrigger?: string
  closeModal?: boolean
  clickTriggers?: string[]
  fillFields?: TutorialFieldFill[]
}

export interface TutorialContext {
  translate: (key: string, params?: Record<string, unknown>) => string
}

export interface TutorialDefinition {
  id: string
  titleKey: string
  descriptionKey: string
  tag: TutorialTag
  icon: string
  order?: number
  featured?: boolean
  requiredPermissions?: string[]
  permissionOperator?: 'AND' | 'OR'
  superAdminOnly?: boolean
  buildSteps: (context: TutorialContext) => TutorialStep[]
}

export const MAIN_FLOW_TUTORIAL_ID = 'main-flow'
