import { Injectable, inject } from '@angular/core'
import { NavigationStart, Router } from '@angular/router'
import { Subscription, filter } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { driver, type Config, type Driver } from 'driver.js'
import { PermissionsService } from '@core/services/api/permissions.service'
import { StorageService } from '@core/services/ui/storage.service'
import { TutorialMockService } from '@core/services/ui/tutorial-mock.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { MAIN_FLOW_TUTORIAL, TUTORIALS } from '@core/helpers/ui/tutorials-meta'
import {
  MAIN_FLOW_TUTORIAL_ID,
  type TutorialDefinition,
  type TutorialMockTarget,
  type TutorialStep,
  type TutorialTag,
} from '@core/interfaces/ui/tutorial.interface'

@Injectable({ providedIn: 'root' })
export class TutorialService {
  private readonly router = inject(Router)
  private readonly translate = inject(TranslateService)
  private readonly permissions = inject(PermissionsService)
  private readonly storage = inject(StorageService)
  private readonly mock = inject(TutorialMockService)
  private readonly notifications = inject(ToastrNotificationService)

  private readonly WELCOME_KEY = 'TUTORIAL_WELCOME_SEEN'
  private readonly SELECTOR_TIMEOUT = 8000

  private driverInstance: Driver | null = null
  private navigatingInternally = false
  private navigationGuard: Subscription | null = null
  private activeSteps: TutorialStep[] = []
  private isTransitioning = false
  private writeGuardListener: ((event: Event) => void) | null = null
  private allowProgrammaticClick = false

  getMainFlowTutorial(): TutorialDefinition {
    return MAIN_FLOW_TUTORIAL
  }

  getAvailableTutorials(): TutorialDefinition[] {
    return TUTORIALS.filter(
      (tutorial) =>
        tutorial.id !== MAIN_FLOW_TUTORIAL_ID && this.canAccess(tutorial)
    ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  getTutorialsByTag(): Record<TutorialTag, TutorialDefinition[]> {
    return this.getAvailableTutorials().reduce(
      (groups, tutorial) => {
        ;(groups[tutorial.tag] ??= []).push(tutorial)
        return groups
      },
      {} as Record<TutorialTag, TutorialDefinition[]>
    )
  }

  async start(id: string): Promise<void> {
    const definition = TUTORIALS.find((tutorial) => tutorial.id === id)
    if (!definition) {
      return
    }
    const steps = definition.buildSteps({
      translate: (key, params) => this.translate.instant(key, params),
    })
    await this.runSteps(steps)
  }

  hasSeenWelcome(): boolean {
    const raw = this.storage.secureStorage.getItem(this.WELCOME_KEY)
    if (!raw) {
      return false
    }
    try {
      return JSON.parse(raw) === true
    } catch {
      return false
    }
  }

  markWelcomeSeen(): void {
    this.storage.secureStorage.setItem(this.WELCOME_KEY, JSON.stringify(true))
  }

  destroy(): void {
    this.navigationGuard?.unsubscribe()
    this.navigationGuard = null
    this.activeSteps = []
    this.isTransitioning = false
    this.stopWriteGuard()
    this.notifications.setSuppressed(false)
    this.closeOpenModal()
    this.driverInstance?.destroy()
    this.driverInstance = null
    this.mock.restoreAll()
  }

  private canAccess(tutorial: TutorialDefinition): boolean {
    if (tutorial.superAdminOnly) {
      return this.permissions.isSuperAdmin()
    }
    if (!tutorial.requiredPermissions?.length) {
      return true
    }
    if (!this.permissions.isLoaded()) {
      return true
    }
    if (this.permissions.isSuperAdmin()) {
      return true
    }
    const operator = tutorial.permissionOperator ?? 'OR'
    return operator === 'AND'
      ? this.permissions.hasAllPermissionsById(tutorial.requiredPermissions)
      : this.permissions.hasAnyPermissionById(tutorial.requiredPermissions)
  }

  private async runSteps(steps: TutorialStep[]): Promise<void> {
    if (!steps.length) {
      return
    }
    this.destroy()
    this.activeSteps = steps
    this.notifications.setSuppressed(true)

    await this.prepareStep(steps[0])

    this.driverInstance = driver(this.buildConfig(steps))
    this.startNavigationGuard()
    this.startWriteGuard()
    this.driverInstance.drive()
  }

  private startWriteGuard(): void {
    if (this.writeGuardListener) {
      return
    }
    this.writeGuardListener = (event: Event) => {
      if (this.allowProgrammaticClick) {
        return
      }
      const target = event.target as HTMLElement | null
      if (!target || target.closest('.driver-popover, .driver-overlay')) {
        return
      }
      const modal = target.closest('ngb-modal-window, .modal.show')
      if (!modal) {
        return
      }
      const allowed = target.closest(
        '[data-bs-dismiss="modal"], [aria-label="Close"], .btn-close, .modal-header button, .btn-secondary, .btn-outline-secondary, [data-tutorial-allow]'
      )
      if (allowed) {
        return
      }
      const control = target.closest('button, input[type="submit"], input[type="button"]')
      if (control) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    document.addEventListener('click', this.writeGuardListener, true)
    document.addEventListener('submit', this.writeGuardListener, true)
  }

  private stopWriteGuard(): void {
    if (!this.writeGuardListener) {
      return
    }
    document.removeEventListener('click', this.writeGuardListener, true)
    document.removeEventListener('submit', this.writeGuardListener, true)
    this.writeGuardListener = null
  }

  private startNavigationGuard(): void {
    this.navigationGuard = this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => {
        if (!this.navigatingInternally) {
          this.destroy()
        }
      })
  }

  private buildConfig(steps: TutorialStep[]): Config {
    return {
      showProgress: true,
      allowClose: true,
      disableActiveInteraction: true,
      smoothScroll: true,
      popoverClass: 'tutorial-popover',
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 8,
      nextBtnText: this.translate.instant('TUTORIALS.CONTROLS.NEXT'),
      prevBtnText: this.translate.instant('TUTORIALS.CONTROLS.PREV'),
      doneBtnText: this.translate.instant('TUTORIALS.CONTROLS.DONE'),
      progressText: this.translate.instant('TUTORIALS.CONTROLS.PROGRESS'),
      steps: steps.map((step) => this.decorateStep(step)),
      onNextClick: () => this.goToStep(this.currentIndex() + 1),
      onPrevClick: () => this.goToStep(this.currentIndex() - 1),
      onCloseClick: () => this.destroy(),
      onDestroyed: () => {
        this.notifications.setSuppressed(false)
        this.stopWriteGuard()
        this.mock.restoreAll()
        this.driverInstance = null
      },
    }
  }

  private currentIndex(): number {
    return this.driverInstance?.getActiveIndex() ?? 0
  }

  private async goToStep(targetIndex: number): Promise<void> {
    if (!this.driverInstance || this.isTransitioning) {
      return
    }
    if (targetIndex < 0 || targetIndex >= this.activeSteps.length) {
      this.driverInstance.destroy()
      return
    }

    this.isTransitioning = true
    try {
      await this.prepareStep(this.activeSteps[targetIndex])
    } finally {
      this.isTransitioning = false
    }

    if (this.driverInstance) {
      this.driverInstance.moveTo(targetIndex)
    }
  }

  private decorateStep(step: TutorialStep): TutorialStep {
    const primary =
      step.primarySelector ??
      (typeof step.element === 'string' ? step.element : step.awaitSelector)

    return {
      ...step,
      element: primary
        ? () => this.resolveElement(primary, step.fallbackSelector)
        : step.element,
    }
  }

  private resolveElement(selector: string, fallback?: string): Element {
    const primary = this.queryVisible(selector)
    if (primary) {
      return this.toVisibleTarget(primary)
    }
    const fallbackElement = fallback ? this.queryVisible(fallback) : null
    const resolved = (fallbackElement ??
      document.querySelector(selector) ??
      (fallback ? document.querySelector(fallback) : null)) as Element
    return resolved ? this.toVisibleTarget(resolved) : resolved
  }

  private toVisibleTarget(element: Element): Element {
    const rect = element.getBoundingClientRect()
    if (rect.width > 1 && rect.height > 1) {
      return element
    }
    let current = element.parentElement
    let depth = 0
    while (current && depth < 4) {
      const parentRect = current.getBoundingClientRect()
      if (parentRect.width > 1 && parentRect.height > 1) {
        return current
      }
      current = current.parentElement
      depth += 1
    }
    return element
  }

  private queryVisible(selector: string): Element | null {
    const matches = document.querySelectorAll(selector)
    if (!matches.length) {
      return null
    }
    for (const element of Array.from(matches)) {
      if (element.getClientRects().length > 0) {
        return element
      }
    }
    return matches[0]
  }

  private async prepareStep(step: TutorialStep): Promise<void> {
    if (step.route && !this.isOnRoute(step.route)) {
      this.navigatingInternally = true
      try {
        await this.router.navigate([step.route], {
          queryParams: step.queryParams,
        })
      } finally {
        this.navigatingInternally = false
      }
    }
    if (step.mockTarget && !this.mock.isActive(step.mockTarget)) {
      await this.waitForRegistration(step.mockTarget)
      this.mock.apply(step.mockTarget)
    }
    if (step.closeModal) {
      this.closeOpenModal()
    }
    if (step.openModalTrigger) {
      await this.openModalFor(step.openModalTrigger)
    }
    if (step.fillFields?.length) {
      for (const field of step.fillFields) {
        this.fillField(field.selector, field.value)
      }
      await this.nextTick()
    }
    if (step.clickTriggers?.length) {
      for (const trigger of step.clickTriggers) {
        await this.clickAndSettle(trigger)
      }
    }
    if (step.awaitSelector) {
      await this.waitForSelector(step.awaitSelector)
    }
    this.scrollTargetIntoView(step)
  }

  private scrollTargetIntoView(step: TutorialStep): void {
    const selector =
      step.primarySelector ??
      (typeof step.element === 'string' ? step.element : step.awaitSelector)
    if (!selector) {
      return
    }
    const element = this.queryVisible(selector)
    if (!element) {
      return
    }
    this.toVisibleTarget(element).scrollIntoView({
      block: 'center',
      inline: 'nearest',
    })
  }

  private fillField(selector: string, value: string): void {
    const field = this.queryVisible(selector) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null
    if (!field) {
      return
    }
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(field),
      'value'
    )?.set
    setter ? setter.call(field, value) : (field.value = value)
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
    field.dispatchEvent(new Event('blur', { bubbles: true }))
  }

  private async clickAndSettle(selector: string): Promise<void> {
    const trigger = this.queryVisible(selector) as HTMLElement | null
    if (!trigger) {
      return
    }
    this.allowProgrammaticClick = true
    try {
      trigger.click()
    } finally {
      this.allowProgrammaticClick = false
    }
    await this.nextTick()
  }

  private nextTick(): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, 120))
  }

  private async openModalFor(triggerSelector: string): Promise<void> {
    if (document.querySelector('.modal.show, ngb-modal-window')) {
      return
    }
    const trigger = this.queryVisible(triggerSelector) as HTMLElement | null
    if (!trigger) {
      return
    }
    trigger.click()
    await this.waitForSelector('.modal.show, ngb-modal-window')
  }

  private closeOpenModal(): void {
    const modal = document.querySelector(
      'ngb-modal-window, .modal.show'
    ) as HTMLElement | null
    if (!modal) {
      return
    }
    const dismiss = modal.querySelector(
      '[data-bs-dismiss="modal"], [aria-label="Close"], .btn-close, .modal-header button'
    ) as HTMLElement | null
    if (dismiss) {
      dismiss.click()
      return
    }
    modal.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    )
  }

  private waitForRegistration(target: TutorialMockTarget): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now()
      const check = () => {
        if (
          this.mock.hasTarget(target) ||
          performance.now() - start > this.SELECTOR_TIMEOUT
        ) {
          resolve()
        } else {
          window.setTimeout(check, 60)
        }
      }
      check()
    })
  }

  private isOnRoute(route: string): boolean {
    const current = this.router.url.split('?')[0]
    return current === route || current.startsWith(`${route}?`)
  }

  private waitForSelector(selector: string): Promise<void> {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        resolve()
        return
      }

      const start = performance.now()
      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          observer.disconnect()
          resolve()
        } else if (performance.now() - start > this.SELECTOR_TIMEOUT) {
          observer.disconnect()
          resolve()
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })

      window.setTimeout(() => {
        observer.disconnect()
        resolve()
      }, this.SELECTOR_TIMEOUT)
    })
  }
}
