import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormGroup } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { Subject } from 'rxjs'

@Component({
  selector: 'app-laboratory-order-step1',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './laboratory-order-step1.component.html',
  styleUrls: ['./laboratory-order-step1.component.scss'],
})
export class LaboratoryOrderStep1Component implements OnInit, OnDestroy {
  @Input() formGroup!: FormGroup
  @Input() preloadedData: any = null

  private destroy$ = new Subject<void>()

  ngOnInit(): void {
    if (this.preloadedData) {
      this.loadPrefilledData()
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private loadPrefilledData(): void {}

  get userDisplayName(): string {
    if (this.preloadedData) {
      return `${this.preloadedData.firstName || ''} ${this.preloadedData.lastName || ''}`.trim()
    }
    return ''
  }

  get userDocumentNumber(): string {
    return this.preloadedData?.documentNumber || ''
  }

  get userEmail(): string {
    return this.preloadedData?.email || ''
  }

  get userMobilePhone(): string {
    return this.preloadedData?.mobilePhone || ''
  }

  get userHomePhone(): string {
    return this.preloadedData?.homePhone || ''
  }
}
