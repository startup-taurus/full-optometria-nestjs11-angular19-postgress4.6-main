import { CommonModule } from '@angular/common'
import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { finalize } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'
import { PageTitleComponent } from '@/app/shared/components/layouts/page-title/page-title.component'
import { NotificationsService } from '@core/services/api/notifications.service'
import {
  ReminderRule,
  RenewalEligiblePatient,
  WhatsAppSession,
} from '@core/interfaces/api/notifications.interface'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { WhatsappQrCardComponent } from '../components/whatsapp-qr-card/whatsapp-qr-card.component'
import { WhatsappStatusBadgeComponent } from '../components/whatsapp-status-badge/whatsapp-status-badge.component'
import { ReminderRulesFormComponent } from '../components/reminder-rules-form/reminder-rules-form.component'
import { MessageTemplateEditorComponent } from '../components/message-template-editor/message-template-editor.component'
import { EligiblePatientsTableComponent } from '../components/eligible-patients-table/eligible-patients-table.component'

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    NgbTooltipModule,
    NgbNavModule,
    PageTitleComponent,
    WhatsappQrCardComponent,
    WhatsappStatusBadgeComponent,
    ReminderRulesFormComponent,
    MessageTemplateEditorComponent,
    EligiblePatientsTableComponent,
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService)
  private readonly notificationService = inject(ToastrNotificationService)
  private readonly translate = inject(TranslateService)
  private readonly destroyRef = inject(DestroyRef)

  readonly session = signal<WhatsAppSession | null>(null)
  readonly reminderRule = signal<ReminderRule | null>(null)
  readonly eligiblePatients = signal<RenewalEligiblePatient[]>([])
  readonly selectedPatientIds = signal<string[]>([])
  readonly manualMessageTemplate = signal('')
  readonly search = signal('')
  readonly activeTab = signal(1)

  readonly initLoading = signal(false)
  readonly loadingEligible = signal(false)
  readonly sendingManual = signal(false)
  readonly savingRule = signal(false)

  private defaultTemplate = ''

  ngOnInit(): void {
    this.initializeDefaultTemplate()
    this.loadInitialSession()
    this.subscribeSessionStream()
    this.loadRule()
    this.loadEligible()
  }

  private loadInitialSession(): void {
    this.notificationsService
      .getWhatsAppSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.data && !this.session()) {
            this.session.set(response.data)
          }
        },
        error: () => {},
      })
  }

  private subscribeSessionStream(): void {
    this.notificationsService
      .streamSession()
      .pipe(
        distinctUntilChanged(
          (a, b) =>
            a?.status === b?.status &&
            a?.qrCode === b?.qrCode &&
            a?.connectedPhone === b?.connectedPhone
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (session) => {
          console.log(
            `[FE_SESSION_SET] status=${session?.status} qrCodeLen=${session?.qrCode?.length || 0} ts=${Date.now()}`
          )
          this.session.set(session)
          this.initLoading.set(false)
        },
        error: (err) => {
          console.error('[notifications] stream error', err)
        },
      })
  }

  isConnected(): boolean {
    return this.session()?.status === 'connected'
  }

  onGenerateQr(): void {
    if (this.initLoading()) return
    this.initLoading.set(true)
    this.notificationsService
      .initWhatsAppSession()
      .pipe(finalize(() => this.initLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.session.set(response.data)
        },
        error: () => {
          this.notificationService.showNotification({
            title: 'NOTIFICATIONS.TITLE',
            message: 'NOTIFICATIONS.SESSION.ERROR_LOADING',
            type: 'error',
          })
        },
      })
  }

  onRefreshQr(): void {
    this.notificationsService.refreshWhatsAppQr().subscribe({
      next: (response) => {
        this.session.set(response.data)
      },
    })
  }

  onDisconnect(): void {
    this.notificationsService.logoutWhatsAppSession().subscribe({
      next: (response) => {
        this.session.set(response.data)
        this.selectedPatientIds.set([])
        this.notificationService.showNotification({
          title: 'NOTIFICATIONS.TITLE',
          message: 'NOTIFICATIONS.SESSION.LOGOUT_SUCCESS',
          type: 'success',
        })
      },
    })
  }

  loadRule(): void {
    this.notificationsService.getReminderRule().subscribe({
      next: (response) => this.reminderRule.set(response.data),
    })
  }

  saveRule(payload: Partial<ReminderRule>): void {
    this.savingRule.set(true)
    this.notificationsService
      .updateReminderRule(payload)
      .pipe(finalize(() => this.savingRule.set(false)))
      .subscribe({
        next: (response) => {
          this.reminderRule.set(response.data)
          this.notificationService.showNotification({
            title: 'NOTIFICATIONS.TITLE',
            message: 'NOTIFICATIONS.RULE.UPDATED',
            type: 'success',
          })
          this.loadEligible()
        },
      })
  }

  loadEligible(): void {
    this.loadingEligible.set(true)
    this.notificationsService
      .getRenewalEligible({
        page: 1,
        limit: 50,
        search: this.search(),
        includeAll: true,
      })
      .pipe(finalize(() => this.loadingEligible.set(false)))
      .subscribe({
        next: (response) => {
          const list = response.data.result || []
          this.eligiblePatients.set(list)
          const validIds = new Set(list.map((p) => p.patientId))
          this.selectedPatientIds.update((current) =>
            current.filter((id) => validIds.has(id))
          )
        },
      })
  }

  onSearchChange(value: string): void {
    this.search.set(value)
    this.loadEligible()
  }

  onSelectionChange(ids: string[]): void {
    this.selectedPatientIds.set(ids)
  }

  onTemplateChange(value: string): void {
    this.manualMessageTemplate.set(value)
  }

  sendManual(): void {
    if (!this.selectedPatientIds().length) {
      this.notificationService.showNotification({
        title: 'NOTIFICATIONS.TITLE',
        message: 'NOTIFICATIONS.ELIGIBLE.SELECT_REQUIRED',
        type: 'warning',
      })
      return
    }

    this.sendingManual.set(true)
    this.notificationsService
      .sendManualRenewalReminder({
        patientIds: this.selectedPatientIds(),
        messageTemplate:
          this.manualMessageTemplate() || this.defaultTemplate,
      })
      .pipe(finalize(() => this.sendingManual.set(false)))
      .subscribe({
        next: (response) => {
          const data = response.data
          const resultMessage = this.translate.instant(
            'NOTIFICATIONS.ELIGIBLE.SEND_RESULT',
            { sent: data.sent, failed: data.failed }
          )
          this.notificationService.showNotification({
            title: 'NOTIFICATIONS.TITLE',
            message: resultMessage,
            type: 'success',
          })
          this.selectedPatientIds.set([])
          this.loadEligible()
        },
      })
  }

  private initializeDefaultTemplate(): void {
    const translated = this.translate.instant(
      'NOTIFICATIONS.TEMPLATE.DEFAULT_MESSAGE'
    )
    this.defaultTemplate =
      translated ||
      'Hola {{nombres}} {{apellidos}}, te recordamos que tu renovación de lentes está próxima.'
    if (!this.manualMessageTemplate()) {
      this.manualMessageTemplate.set(this.defaultTemplate)
    }
  }
}
