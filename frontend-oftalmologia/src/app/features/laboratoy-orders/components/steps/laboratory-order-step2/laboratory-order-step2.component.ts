import { Component, Input, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormGroup } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { Subject } from 'rxjs'

@Component({
  selector: 'app-laboratory-order-step2',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './laboratory-order-step2.component.html',
  styleUrls: ['./laboratory-order-step2.component.scss'],
})
export class LaboratoryOrderStep2Component implements OnInit, OnDestroy {
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

  private loadPrefilledData(): void {
    if (!this.preloadedData) {
      return
    }

    const opticalPrefillFields = [
      'odSphere',
      'odCylinder',
      'odAxis',
      'odAdd',
      'odHeight',
      'odDnp',
      'oiSphere',
      'oiCylinder',
      'oiAxis',
      'oiAdd',
      'oiHeight',
      'oiDnp',
      'cbase',
      'sunDegree',
      'prism',
      'base',
    ] as const

    const hasOpticalPrefill = opticalPrefillFields.some(
      (field) => this.preloadedData[field] !== undefined
    )

    if (!hasOpticalPrefill) {
      return
    }

    this.formGroup.patchValue({
      odSphere: this.preloadedData.odSphere ?? null,
      odCylinder: this.preloadedData.odCylinder ?? null,
      odAxis: this.preloadedData.odAxis ?? null,
      odAdd: this.preloadedData.odAdd ?? null,
      odHeight: this.preloadedData.odHeight ?? null,
      odDnp: this.preloadedData.odDnp ?? null,
      oiSphere: this.preloadedData.oiSphere ?? null,
      oiCylinder: this.preloadedData.oiCylinder ?? null,
      oiAxis: this.preloadedData.oiAxis ?? null,
      oiAdd: this.preloadedData.oiAdd ?? null,
      oiHeight: this.preloadedData.oiHeight ?? null,
      oiDnp: this.preloadedData.oiDnp ?? null,
      cbase: this.preloadedData.cbase ?? null,
      sunDegree: this.preloadedData.sunDegree ?? null,
      prism: this.preloadedData.prism ?? null,
      base: this.preloadedData.base ?? null,
    })
  }
}
