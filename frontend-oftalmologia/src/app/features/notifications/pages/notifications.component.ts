import { CommonModule } from '@angular/common'
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { finalize } from 'rxjs'
import { Store } from '@ngrx/store'
import { selectUser } from '@core/states/auth/auth.selectors'
import { PageTitleComponent } from '@/app/shared/components/layouts/page-title/page-title.component'
import { NotificationsService } from '@core/services/api/notifications.service'
import {
  ReminderRule,
  RenewalEligiblePatient,
  WhatsAppSession,
} from '@core/interfaces/api/notifications.interface'
import { ToastrNotificationService } from '@core/services/ui/notification.service'

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NgbTooltipModule, PageTitleComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private readonly notificationsService = inject(NotificationsService)
  private readonly notificationService = inject(ToastrNotificationService)
  private readonly router = inject(Router)
  private readonly store = inject(Store)
  private readonly translate = inject(TranslateService)

  session: WhatsAppSession | null = null
  reminderRule: ReminderRule | null = null
  eligiblePatients: RenewalEligiblePatient[] = []
  selectedPatientIds: string[] = []
  currentUser$ = this.store.select(selectUser)

  manualMessageTemplate = ''
  templateDraft = ''
  isTemplateModalOpen = false
  search = ''
  syncingSession = false
  lastSessionSyncAt: Date | null = null
  defaultManualTemplate = ''
  readonly templateVariables = [
    { key: 'nombres', labelKey: 'NOTIFICATIONS.TEMPLATE.VARIABLES.NOMBRES' },
    { key: 'apellidos', labelKey: 'NOTIFICATIONS.TEMPLATE.VARIABLES.APELLIDOS' },
    { key: 'cedula', labelKey: 'NOTIFICATIONS.TEMPLATE.VARIABLES.CEDULA' },
    { key: 'telefono', labelKey: 'NOTIFICATIONS.TEMPLATE.VARIABLES.TELEFONO' },
  ]
  @ViewChild('templateTextarea') templateTextarea?: ElementRef<HTMLTextAreaElement>
  private readonly sessionSyncMs = 30000
  private sessionSyncTimer: ReturnType<typeof setInterval> | null = null

  loadingSession = false
  loadingRule = false
  loadingEligible = false
  sendingManual = false
  savingRule = false

  ngOnInit(): void {
    this.initializeTemplateTexts()
    this.loadSession()
    this.loadRule()
    this.loadEligible()
    this.startAutoSessionSync()
  }

  ngOnDestroy(): void {
    this.stopAutoSessionSync()
  }

  loadSession(silent = false): void {
    if (this.loadingSession || this.syncingSession) {
      return
    }

    if (silent) {
      this.syncingSession = true
    } else {
      this.loadingSession = true
    }

    this.notificationsService
      .getWhatsAppSession()
      .pipe(
        finalize(() => {
          if (silent) {
            this.syncingSession = false
            return
          }

          this.loadingSession = false
        })
      )
      .subscribe({
        next: (response) => {
          this.session = response.data
          this.lastSessionSyncAt = new Date()
        },
      })
  }



  logoutSession(): void {
    this.loadingSession = true
    this.notificationsService
      .logoutWhatsAppSession()
      .pipe(finalize(() => (this.loadingSession = false)))
      .subscribe({
        next: (response) => {
          this.session = response.data
          this.showSuccess('NOTIFICATIONS.SESSION.LOGOUT_SUCCESS')
        },
      })
  }

  loadRule(): void {
    this.loadingRule = true
    this.notificationsService
      .getReminderRule()
      .pipe(finalize(() => (this.loadingRule = false)))
      .subscribe({
        next: (response) => {
          this.reminderRule = response.data
        },
      })
  }

  saveRule(): void {
    if (!this.reminderRule) {
      return
    }

    this.savingRule = true
    this.notificationsService
      .updateReminderRule(this.reminderRule)
      .pipe(finalize(() => (this.savingRule = false)))
      .subscribe({
        next: (response) => {
          this.reminderRule = response.data
          this.showSuccess('NOTIFICATIONS.RULE.UPDATED')
          this.loadEligible()
        },
      })
  }

  loadEligible(): void {
    this.loadingEligible = true
    this.notificationsService
      .getRenewalEligible({ page: 1, limit: 50, search: this.search, includeAll: true })
      .pipe(finalize(() => (this.loadingEligible = false)))
      .subscribe({
        next: (response) => {
          this.eligiblePatients = response.data.result || []
          this.selectedPatientIds = this.selectedPatientIds.filter((id) =>
            this.eligiblePatients.some((item) => item.patientId === id)
          )
        },
      })
  }

  togglePatient(patientId: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedPatientIds.includes(patientId)) {
        this.selectedPatientIds = [...this.selectedPatientIds, patientId]
      }
      return
    }

    this.selectedPatientIds = this.selectedPatientIds.filter((id) => id !== patientId)
  }

  sendManual(): void {
    if (!this.selectedPatientIds.length) {
      this.notificationService.showNotification({
        title: 'NOTIFICATIONS.TITLE',
        message: 'NOTIFICATIONS.ELIGIBLE.SELECT_REQUIRED',
        type: 'warning',
      })
      return
    }

    this.sendingManual = true
    this.notificationsService
      .sendManualRenewalReminder({
        patientIds: this.selectedPatientIds,
        messageTemplate: this.manualMessageTemplate,
      })
      .pipe(finalize(() => (this.sendingManual = false)))
      .subscribe({
        next: (response) => {
          const data = response.data
          const resultMessage = this.translate.instant('NOTIFICATIONS.ELIGIBLE.SEND_RESULT', {
            sent: data.sent,
            failed: data.failed,
          })

          this.notificationService.showNotification({
            title: 'NOTIFICATIONS.TITLE',
            message: resultMessage,
            type: 'success',
          })
          this.loadEligible()
        },
      })
  }

  isSelected(patientId: string): boolean {
    return this.selectedPatientIds.includes(patientId)
  }

  goToProfile(): void {
    this.router.navigate(['/profile'])
  }

  openTemplateModal(): void {
    this.templateDraft = this.manualMessageTemplate || this.defaultManualTemplate
    this.isTemplateModalOpen = true

    setTimeout(() => {
      this.templateTextarea?.nativeElement.focus()
    })
  }

  closeTemplateModal(): void {
    this.isTemplateModalOpen = false
  }

  applyTemplateDraft(): void {
    const normalizedTemplate = this.templateDraft.trim()
    this.manualMessageTemplate = normalizedTemplate || this.defaultManualTemplate
    this.closeTemplateModal()
  }

  resetTemplateDraft(): void {
    this.templateDraft = this.defaultManualTemplate
  }

  insertVariable(variableKey: string): void {
    const token = `{{${variableKey}}}`
    const textarea = this.templateTextarea?.nativeElement
    if (!textarea) {
      this.templateDraft = `${this.templateDraft}${token}`
      return
    }

    const start = textarea.selectionStart ?? this.templateDraft.length
    const end = textarea.selectionEnd ?? this.templateDraft.length
    this.templateDraft = `${this.templateDraft.slice(0, start)}${token}${this.templateDraft.slice(end)}`

    setTimeout(() => {
      textarea.focus()
      const nextPos = start + token.length
      textarea.setSelectionRange(nextPos, nextPos)
    })
  }

  get templatePreview(): string {
    return this.interpolateTemplate(this.templateDraft || this.defaultManualTemplate)
  }

  private interpolateTemplate(template: string): string {
    const previewPatient = this.getPreviewPatient()
    const previewPatientLabel = this.translate.instant('NOTIFICATIONS.TEMPLATE.PREVIEW_PATIENT')
    const firstName = (previewPatient?.firstName || previewPatientLabel).trim()
    const lastName = (previewPatient?.lastName || '').trim()
    const values: Record<string, string> = {
      nombre: `${firstName} ${lastName}`.trim(),
      nombres: firstName,
      apellidos: lastName,
      cedula: previewPatient?.documentNumber || '0000000000',
      telefono: previewPatient?.phone || '+593000000000',
    }

    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
      const normalizedKey = key.toLowerCase()
      return values[normalizedKey] ?? ''
    })
  }

  private initializeTemplateTexts(): void {
    const translatedDefault = this.translate.instant('NOTIFICATIONS.TEMPLATE.DEFAULT_MESSAGE')
    this.defaultManualTemplate = translatedDefault || 'Hola {{nombres}} {{apellidos}}, te recordamos que tu renovación de lentes está próxima. Agenda tu cita cuando gustes.'

    if (!this.manualMessageTemplate) {
      this.manualMessageTemplate = this.defaultManualTemplate
    }
  }

  private getPreviewPatient(): RenewalEligiblePatient | undefined {
    if (this.selectedPatientIds.length) {
      return this.eligiblePatients.find((patient) =>
        this.selectedPatientIds.includes(patient.patientId)
      )
    }

    return this.eligiblePatients[0]
  }

  private startAutoSessionSync(): void {
    if (this.sessionSyncTimer) {
      return
    }

    this.sessionSyncTimer = setInterval(() => {
      this.loadSession(true)
    }, this.sessionSyncMs)
  }

  private stopAutoSessionSync(): void {
    if (!this.sessionSyncTimer) {
      return
    }

    clearInterval(this.sessionSyncTimer)
    this.sessionSyncTimer = null
  }

  get canShowLogoutAction(): boolean {
    return !!this.session && this.session.status === 'connected'
  }

  private showSuccess(message: string): void {
    this.notificationService.showNotification({
      title: 'NOTIFICATIONS.TITLE',
      message,
      type: 'success',
    })
  }
}
