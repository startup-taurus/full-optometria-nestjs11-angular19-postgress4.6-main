import { CommonModule } from '@angular/common'
import { Component, DestroyRef, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { Store } from '@ngrx/store'
import { selectUser } from '@core/states/auth/auth.selectors'
import { NotificationsService } from '@core/services/api/notifications.service'
import { WhatsAppSession } from '@core/interfaces/api/notifications.interface'

@Component({
  selector: 'profile-whatsapp-session',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './whatsapp-session.component.html',
  styleUrl: './whatsapp-session.component.scss',
})
export class WhatsAppSessionComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService)
  private readonly store = inject(Store)
  private readonly destroyRef = inject(DestroyRef)

  session: WhatsAppSession | null = null
  currentUser$ = this.store.select(selectUser)
  loading = true

  ngOnInit(): void {
    this.notificationsService
      .getWhatsAppSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.session = response.data
          this.loading = false
        },
        error: () => {
          this.loading = false
        },
      })
  }

  get statusKey(): string {
    if (!this.session) return 'NOTIFICATIONS.SESSION.STATUS_DISCONNECTED'
    switch (this.session.status) {
      case 'connected':
        return 'NOTIFICATIONS.SESSION.STATUS_CONNECTED'
      case 'qr_ready':
        return 'NOTIFICATIONS.SESSION.STATUS_QR_READY'
      default:
        return 'NOTIFICATIONS.SESSION.STATUS_DISCONNECTED'
    }
  }

  get statusClass(): string {
    if (this.session?.status === 'connected') return 'is-connected'
    if (this.session?.status === 'qr_ready') return 'is-pending'
    return 'is-offline'
  }
}
