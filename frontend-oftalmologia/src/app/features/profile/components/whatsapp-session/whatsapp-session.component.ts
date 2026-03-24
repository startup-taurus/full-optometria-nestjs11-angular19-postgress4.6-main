import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { finalize } from 'rxjs'
import { Store } from '@ngrx/store'
import { selectUser } from '@core/states/auth/auth.selectors'
import { NotificationsService } from '@core/services/api/notifications.service'
import { WhatsAppSession } from '@core/interfaces/api/notifications.interface'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { User } from '@core/interfaces/api/user.interface'

@Component({
  selector: 'profile-whatsapp-session',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './whatsapp-session.component.html',
  styleUrl: './whatsapp-session.component.scss',
})
export class WhatsAppSessionComponent implements OnInit, OnDestroy {
  private readonly notificationsService = inject(NotificationsService)
  private readonly notificationService = inject(ToastrNotificationService)
  private readonly store = inject(Store)

  loading = false
  refreshingQr = false
  session: WhatsAppSession | null = null
  currentUser$ = this.store.select(selectUser)
  private readonly qrRefreshMs = 30000
  private readonly postRefreshReloadMs = 2500
  private readonly sessionSyncMs = 30000
  private readonly maxSilentRefreshErrors = 3
  private silentRefreshErrors = 0
  private qrRefreshTimer: ReturnType<typeof setInterval> | null = null
  private postRefreshReloadTimer: ReturnType<typeof setTimeout> | null = null
  private sessionSyncTimer: ReturnType<typeof setInterval> | null = null
  syncingSession = false
  lastSessionSyncAt: Date | null = null

  ngOnInit(): void {
    this.loadSession()
    this.startAutoSessionSync()
  }

  ngOnDestroy(): void {
    this.stopAutoQrRefresh()
    this.stopPostRefreshReload()
    this.stopAutoSessionSync()
  }

  loadSession(silent = false): void {
    if (this.loading || this.syncingSession || this.refreshingQr) {
      return
    }

    if (silent) {
      this.syncingSession = true
    } else {
      this.loading = true
    }

    this.notificationsService
      .getWhatsAppSession()
      .pipe(
        finalize(() => {
          if (silent) {
            this.syncingSession = false
            return
          }

          this.loading = false
        })
      )
      .subscribe({
        next: (response) => {
          this.session = response.data
          this.silentRefreshErrors = 0
          this.lastSessionSyncAt = new Date()
          this.syncQrRefreshLifecycle()
        },
        error: (err) => {
          this.stopAutoQrRefresh()
          void err
        },
      })
  }

  refreshQr(silent = false): void {
    if (this.refreshingQr) {
      return
    }

    this.refreshingQr = true
    this.notificationsService
      .refreshWhatsAppQr()
      .pipe(finalize(() => (this.refreshingQr = false)))
      .subscribe({
        next: (response) => {
          this.session = response.data
          this.silentRefreshErrors = 0
          this.syncQrRefreshLifecycle()

          if (!silent) {
            this.schedulePostRefreshReload()
          }
        },
        error: (err) => {
          void err
          if (silent) {
            this.silentRefreshErrors += 1

            if (this.silentRefreshErrors >= this.maxSilentRefreshErrors) {
              this.silentRefreshErrors = 0
              this.notificationService.showNotification({
                title: 'NOTIFICATIONS.TITLE',
                message: 'NOTIFICATIONS.SESSION.ERROR_LOADING',
                type: 'warning',
              })
            }

            return
          }

          if (!silent) {
            this.notificationService.showNotification({
              title: 'NOTIFICATIONS.TITLE',
              message: 'NOTIFICATIONS.SESSION.ERROR_LOADING',
              type: 'error',
            })
          }
        },
      })
  }

  initSession(): void {
    if (this.loading) {
      return
    }

    this.loading = true
    this.notificationsService
      .initWhatsAppSession()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.session = response.data
          this.silentRefreshErrors = 0
          this.syncQrRefreshLifecycle()
        },
        error: (err) => {
          void err
          this.notificationService.showNotification({
            title: 'NOTIFICATIONS.TITLE',
            message: 'NOTIFICATIONS.SESSION.ERROR_LOADING',
            type: 'error',
          })
        },
      })
  }

  onQrLoad(): void {
  }

  onQrError(event: any): void {
    void event
  }



  logout(): void {
    this.loading = true
    this.notificationsService
      .logoutWhatsAppSession()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.session = response.data
          this.showSuccess('NOTIFICATIONS.SESSION.LOGOUT_SUCCESS')
        },
      })
  }

  private showSuccess(message: string): void {
    this.notificationService.showNotification({
      title: 'NOTIFICATIONS.TITLE',
      message,
      type: 'success',
    })
  }

  private syncQrRefreshLifecycle(): void {
    if (this.session?.status === 'qr_ready' && this.hasValidImageQr) {
      this.startAutoQrRefresh()
      return
    }

    this.stopAutoQrRefresh()

    if (this.session?.status === 'qr_ready' && !this.hasValidImageQr && !this.refreshingQr) {
      this.refreshQr(true)
    }
  }

  private startAutoQrRefresh(): void {
    if (this.qrRefreshTimer) {
      return
    }

    this.qrRefreshTimer = setInterval(() => {
      if (this.isQrLikelyStale) {
        this.refreshQr(true)
      }
    }, this.qrRefreshMs)
  }

  private stopAutoQrRefresh(): void {
    if (!this.qrRefreshTimer) {
      return
    }

    clearInterval(this.qrRefreshTimer)
    this.qrRefreshTimer = null
  }

  private schedulePostRefreshReload(): void {
    this.stopPostRefreshReload()
    this.postRefreshReloadTimer = setTimeout(() => {
      this.loadSession(true)
    }, this.postRefreshReloadMs)
  }

  private stopPostRefreshReload(): void {
    if (!this.postRefreshReloadTimer) {
      return
    }

    clearTimeout(this.postRefreshReloadTimer)
    this.postRefreshReloadTimer = null
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

  get hasValidImageQr(): boolean {
    const qrCode = this.session?.qrCode
    if (!qrCode) {
      return false
    }

    return /^data:image\/(png|jpeg|jpg);base64,/.test(qrCode)
  }

  get isQrLikelyStale(): boolean {
    if (this.session?.status !== 'qr_ready' || !this.session?.updatedAt) {
      return false
    }

    const updatedTime = new Date(this.session.updatedAt).getTime()
    if (Number.isNaN(updatedTime)) {
      return false
    }

    return Date.now() - updatedTime > 45000
  }

  get statusBadgeClass(): string {
    if (!this.session) {
      return 'text-bg-secondary'
    }

    if (this.session.status === 'connected') {
      return 'text-bg-success'
    }

    if (this.session.status === 'qr_ready') {
      return 'text-bg-warning'
    }

    return 'text-bg-secondary'
  }
}
