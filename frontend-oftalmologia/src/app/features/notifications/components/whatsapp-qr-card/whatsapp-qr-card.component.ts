import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  Output,
  computed,
  effect,
  input,
  signal,
} from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { WhatsAppSession } from '@core/interfaces/api/notifications.interface'
import { WhatsappLoadingAnimationComponent } from '../whatsapp-loading-animation/whatsapp-loading-animation.component'

@Component({
  selector: 'app-whatsapp-qr-card',
  standalone: true,
  imports: [CommonModule, TranslateModule, WhatsappLoadingAnimationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './whatsapp-qr-card.component.html',
  styleUrl: './whatsapp-qr-card.component.scss',
})
export class WhatsappQrCardComponent implements OnDestroy {
  readonly session = input<WhatsAppSession | null>(null)
  readonly loading = input<boolean>(false)

  @Output() generate = new EventEmitter<void>()
  @Output() refresh = new EventEmitter<void>()
  @Output() disconnect = new EventEmitter<void>()

  readonly remainingSeconds = signal(60)
  readonly justConnected = signal(false)

  private countdownTimer: ReturnType<typeof setInterval> | null = null
  private connectedAnimTimer: ReturnType<typeof setTimeout> | null = null
  private previousStatus: string | null = null

  readonly viewState = computed<
    'idle' | 'loading' | 'qr_ready' | 'connected'
  >(() => {
    const sess = this.session()
    if (this.loading()) return 'loading'
    if (!sess) return 'idle'
    if (sess.status === 'connected') return 'connected'
    if (sess.status === 'qr_ready' && this.hasValidImageQrFor(sess))
      return 'qr_ready'
    if (sess.status === 'qr_ready' && !this.hasValidImageQrFor(sess))
      return 'loading'
    return 'idle'
  })

  constructor() {
    effect(() => {
      const sess = this.session()
      const nextStatus = sess?.status || null

      if (nextStatus === 'qr_ready' && this.hasValidImageQrFor(sess)) {
        this.startCountdown(sess)
      } else {
        this.stopCountdown()
      }

      if (
        nextStatus === 'connected' &&
        this.previousStatus &&
        this.previousStatus !== 'connected'
      ) {
        this.triggerConnectedAnimation()
      }

      this.previousStatus = nextStatus
    })
  }

  ngOnDestroy(): void {
    this.stopCountdown()
    if (this.connectedAnimTimer) {
      clearTimeout(this.connectedAnimTimer)
    }
  }

  hasValidImageQr(): boolean {
    return this.hasValidImageQrFor(this.session())
  }

  private hasValidImageQrFor(session: WhatsAppSession | null): boolean {
    const qr = session?.qrCode
    if (!qr) return false
    return /^data:image\/(png|jpeg|jpg);base64,/.test(qr)
  }

  onGenerate(): void {
    this.generate.emit()
  }

  onRefresh(): void {
    this.refresh.emit()
  }

  onDisconnect(): void {
    this.disconnect.emit()
  }

  private startCountdown(session: WhatsAppSession | null): void {
    this.stopCountdown()
    const updatedAt = session?.updatedAt
      ? new Date(session.updatedAt).getTime()
      : Date.now()
    const elapsed = Math.floor((Date.now() - updatedAt) / 1000)
    const initial = Math.max(0, 60 - elapsed)
    this.remainingSeconds.set(initial)

    this.countdownTimer = setInterval(() => {
      const current = this.remainingSeconds()
      if (current <= 0) {
        this.stopCountdown()
        return
      }
      this.remainingSeconds.set(current - 1)
    }, 1000)
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
  }

  private triggerConnectedAnimation(): void {
    this.justConnected.set(true)
    if (this.connectedAnimTimer) clearTimeout(this.connectedAnimTimer)
    this.connectedAnimTimer = setTimeout(() => {
      this.justConnected.set(false)
    }, 1800)
  }
}
