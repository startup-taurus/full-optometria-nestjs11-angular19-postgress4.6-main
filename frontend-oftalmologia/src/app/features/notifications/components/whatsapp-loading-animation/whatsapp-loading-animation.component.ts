import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-whatsapp-loading-animation',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './whatsapp-loading-animation.component.html',
  styleUrl: './whatsapp-loading-animation.component.scss',
})
export class WhatsappLoadingAnimationComponent implements OnInit, OnDestroy {
  readonly stepIndex = signal(0)
  readonly steps = [
    'NOTIFICATIONS.QR.STEP_INIT',
    'NOTIFICATIONS.QR.STEP_QR',
    'NOTIFICATIONS.QR.STEP_READY',
  ]
  readonly cells = Array.from({ length: 49 }, (_, i) => i)
  private timer: ReturnType<typeof setInterval> | null = null

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.stepIndex.update((idx) => (idx + 1) % this.steps.length)
    }, 2400)
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
