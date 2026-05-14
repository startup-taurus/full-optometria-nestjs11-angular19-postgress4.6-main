import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { ReminderRule } from '@core/interfaces/api/notifications.interface'

@Component({
  selector: 'app-reminder-rules-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reminder-rules-form.component.html',
  styleUrl: './reminder-rules-form.component.scss',
})
export class ReminderRulesFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder)

  @Input() rule: ReminderRule | null = null
  @Input() saving = false
  @Output() save = new EventEmitter<Partial<ReminderRule>>()

  readonly form: FormGroup = this.fb.group({
    isActive: [true],
    appointmentReminderHoursBefore: [24, [Validators.required, Validators.min(1), Validators.max(168)]],
    renewalAfterDays: [365, [Validators.required, Validators.min(30), Validators.max(3650)]],
    renewalNotifyBeforeDays: [15, [Validators.required, Validators.min(1), Validators.max(180)]],
    quietHoursStart: ['21:00', Validators.required],
    quietHoursEnd: ['08:00', Validators.required],
  })

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rule'] && this.rule) {
      this.form.patchValue(
        {
          isActive: this.rule.isActive,
          appointmentReminderHoursBefore: this.rule.appointmentReminderHoursBefore,
          renewalAfterDays: this.rule.renewalAfterDays,
          renewalNotifyBeforeDays: this.rule.renewalNotifyBeforeDays,
          quietHoursStart: this.rule.quietHoursStart,
          quietHoursEnd: this.rule.quietHoursEnd,
        },
        { emitEvent: false }
      )
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return
    this.save.emit(this.form.value)
  }
}
