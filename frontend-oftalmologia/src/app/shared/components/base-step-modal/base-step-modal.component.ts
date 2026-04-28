import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  HostListener,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-base-step-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './base-step-modal.component.html',
  styleUrls: ['./base-step-modal.component.scss'],
})
export class BaseStepModalComponent implements OnInit {
  @Input() modalTitle = ''
  @Input() currentStep = 1
  @Input() totalSteps = 3
  @Input() stepLabels: string[] = []
  @Input() canProceedNext = false
  @Input() canSave = false
  @Input() isLoading = false
  @Input() editMode = false
  @Input() hidePreviousButton = false

  @Output() cancelClicked = new EventEmitter<void>()
  @Output() nextClicked = new EventEmitter<void>()
  @Output() previousClicked = new EventEmitter<void>()
  @Output() saveClicked = new EventEmitter<void>()
  @Output() stepClicked = new EventEmitter<number>()

  ngOnInit(): void {
    if (this.stepLabels.length === 0) {
      this.stepLabels = Array.from(
        { length: this.totalSteps },
        (_, i) => `Paso ${i + 1}`
      )
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  public onEscapePressed(event: KeyboardEvent): void {
    if (this.isLoading) {
      return
    }
    event.preventDefault()
    this.onCancel()
  }

  public getStepClasses(step: number): string {
    const classes = ['step-circle']

    if (step === this.currentStep) {
      classes.push('current')
    } else if (step < this.currentStep) {
      classes.push('completed')
    } else {
      classes.push('inactive')
    }

    return classes.join(' ')
  }

  public onStepClick(step: number): void {
    if (step <= this.currentStep || step === this.currentStep + 1) {
      this.stepClicked.emit(step)
    }
  }

  public onCancel(): void {
    this.cancelClicked.emit()
  }

  public onNext(): void {
    this.nextClicked.emit()
  }

  public onPrevious(): void {
    this.previousClicked.emit()
  }

  public onSave(): void {
    this.saveClicked.emit()
  }

  public isStepClickable(step: number): boolean {
    return step <= this.currentStep || step === this.currentStep + 1
  }
}
