import { CommonModule } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
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
  imports: [CommonModule, FormsModule, TranslateModule, PageTitleComponent],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService)
  private readonly notificationService = inject(ToastrNotificationService)
  private readonly router = inject(Router)
  private readonly store = inject(Store)

  session: WhatsAppSession | null = null
  reminderRule: ReminderRule | null = null
  eligiblePatients: RenewalEligiblePatient[] = []
  selectedPatientIds: string[] = []
  currentUser$ = this.store.select(selectUser)

  manualMessageTemplate =
    'Hola {{nombre}}, te recordamos que tu renovación de lentes está próxima. Agenda tu cita cuando gustes.'
  search = ''

  loadingSession = false
  loadingRule = false
  loadingEligible = false
  sendingManual = false
  savingRule = false

  ngOnInit(): void {
    this.loadSession()
    this.loadRule()
    this.loadEligible()
  }

  loadSession(): void {
    this.loadingSession = true
    this.notificationsService
      .getWhatsAppSession()
      .pipe(finalize(() => (this.loadingSession = false)))
      .subscribe({
        next: (response) => {
          this.session = response.data
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
        message: { es: 'Selecciona al menos un paciente', en: 'Select at least one patient' },
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
          this.notificationService.showNotification({
            title: 'NOTIFICATIONS.TITLE',
            message: {
              es: `Enviados: ${data.sent}, fallidos: ${data.failed}`,
              en: `Sent: ${data.sent}, failed: ${data.failed}`,
            },
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
