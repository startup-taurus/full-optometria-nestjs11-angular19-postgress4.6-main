import { Component, Input, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormGroup } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { Subject } from 'rxjs'

@Component({
  selector: 'app-laboratory-order-step3',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './laboratory-order-step3.component.html',
  styleUrls: ['./laboratory-order-step3.component.scss'],
})
export class LaboratoryOrderStep3Component implements OnInit, OnDestroy {
  @Input() formGroup!: FormGroup

  private destroy$ = new Subject<void>()

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
