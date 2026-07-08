import { ApplicationRef, Injectable, inject } from '@angular/core'
import type {
  TutorialMockable,
  TutorialMockTarget,
} from '@core/interfaces/ui/tutorial.interface'
import {
  MOCK_LABORATORY_ORDERS,
  MOCK_MEDICAL_HISTORY,
  MOCK_PATIENTS,
  MOCK_SHIFTS,
} from '@core/helpers/ui/tutorials/tutorial-mocks'
import { MOCK_CLIENTS } from '@core/helpers/ui/tutorials/mocks/sales.mocks'
import {
  MOCK_CATEGORIES,
  MOCK_INVENTORY,
  MOCK_SUPPLIERS,
} from '@core/helpers/ui/tutorials/mocks/catalog.mocks'
import {
  MOCK_BRANCHES,
  MOCK_COMPANIES,
  MOCK_ROLES,
  MOCK_USERS,
} from '@core/helpers/ui/tutorials/mocks/admin.mocks'

@Injectable({ providedIn: 'root' })
export class TutorialMockService {
  private readonly appRef = inject(ApplicationRef)

  private readonly registry = new Map<TutorialMockTarget, TutorialMockable>()
  private readonly activeTargets = new Set<TutorialMockTarget>()

  private readonly datasets: Record<TutorialMockTarget, unknown[]> = {
    patients: MOCK_PATIENTS,
    shifts: MOCK_SHIFTS,
    'medical-history': MOCK_MEDICAL_HISTORY,
    'laboratory-orders': MOCK_LABORATORY_ORDERS,
    clients: MOCK_CLIENTS,
    users: MOCK_USERS,
    suppliers: MOCK_SUPPLIERS,
    inventory: MOCK_INVENTORY,
    branches: MOCK_BRANCHES,
    companies: MOCK_COMPANIES,
    categories: MOCK_CATEGORIES,
    roles: MOCK_ROLES,
  }

  register(target: TutorialMockTarget, instance: TutorialMockable): void {
    this.registry.set(target, instance)
  }

  unregister(target: TutorialMockTarget, instance: TutorialMockable): void {
    if (this.registry.get(target) === instance) {
      this.registry.delete(target)
      this.activeTargets.delete(target)
    }
  }

  isActive(target: TutorialMockTarget): boolean {
    return this.activeTargets.has(target)
  }

  hasTarget(target: TutorialMockTarget): boolean {
    return this.registry.has(target)
  }

  apply(target: TutorialMockTarget): void {
    const instance = this.registry.get(target)
    if (!instance) {
      return
    }
    this.activeTargets.add(target)
    instance.applyTutorialMock(this.datasets[target])
    this.appRef.tick()
  }

  restoreAll(): void {
    const targets = [...this.activeTargets]
    this.activeTargets.clear()
    for (const target of targets) {
      this.registry.get(target)?.clearTutorialMock()
    }
    this.appRef.tick()
  }
}
