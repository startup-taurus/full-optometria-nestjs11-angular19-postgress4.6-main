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

    if (this.preloadedData.odSphere) {
      this.formGroup.patchValue({
        odSphere: this.preloadedData.odSphere,
        odCylinder: this.preloadedData.odCylinder,
        odAxis: this.preloadedData.odAxis,
        odAdd: this.preloadedData.odAdd,
        oiSphere: this.preloadedData.oiSphere,
        oiCylinder: this.preloadedData.oiCylinder,
        oiAxis: this.preloadedData.oiAxis,
        oiAdd: this.preloadedData.oiAdd,
      })
    }
  }
}
