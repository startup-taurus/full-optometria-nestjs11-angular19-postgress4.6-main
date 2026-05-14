import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

type Status = 'connected' | 'qr_ready' | 'disconnected' | 'idle' | 'loading'

@Component({
  selector: 'app-whatsapp-status-badge',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './whatsapp-status-badge.component.html',
  styleUrl: './whatsapp-status-badge.component.scss',
})
export class WhatsappStatusBadgeComponent {
  @Input() status: Status = 'disconnected'
  @Input() label: string | null = null

  get computedLabel(): string {
    if (this.label) return this.label
    switch (this.status) {
      case 'connected':
        return 'NOTIFICATIONS.SESSION.STATUS_CONNECTED'
      case 'qr_ready':
        return 'NOTIFICATIONS.SESSION.STATUS_QR_READY'
      case 'loading':
        return 'NOTIFICATIONS.QR.GENERATING'
      default:
        return 'NOTIFICATIONS.SESSION.STATUS_DISCONNECTED'
    }
  }
}
