import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'

export type WelcomeDialogAction = 'start' | 'browse' | 'dismiss'

interface WelcomeStep {
  icon: string
  titleKey: string
}

@Component({
  selector: 'app-welcome-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './welcome-dialog.component.html',
  styleUrls: ['./welcome-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeDialogComponent {
  @Output() readonly action = new EventEmitter<WelcomeDialogAction>()

  protected leaving = false

  protected readonly steps: WelcomeStep[] = [
    { icon: 'ti-user-plus', titleKey: 'TUTORIALS.MAIN_FLOW.STEP_PATIENT_TITLE' },
    { icon: 'ti-calendar-plus', titleKey: 'TUTORIALS.MAIN_FLOW.STEP_SHIFT_TITLE' },
    { icon: 'ti-file-text', titleKey: 'TUTORIALS.MAIN_FLOW.STEP_HISTORY_TITLE' },
    { icon: 'ti-flask', titleKey: 'TUTORIALS.MAIN_FLOW.STEP_LAB_TITLE' },
  ]

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.emit('dismiss')
  }

  protected emit(value: WelcomeDialogAction): void {
    if (this.leaving) {
      return
    }
    this.leaving = true
    window.setTimeout(() => this.action.emit(value), 180)
  }
}
