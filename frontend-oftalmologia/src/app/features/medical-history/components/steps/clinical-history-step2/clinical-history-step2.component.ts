import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import {
  ReactiveFormsModule,
  FormGroup,
  FormArray,
  FormControl,
} from '@angular/forms'
import { FieldsConfig } from '@core/interfaces/api/clinical-form-config.interface'

@Component({
  selector: 'app-clinical-history-step2',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './clinical-history-step2.component.html',
  styleUrl: './clinical-history-step2.component.scss',
})
export class ClinicalHistoryStep2Component {
  @Input({ required: true }) formGroup!: FormGroup
  @Input() fieldsConfig: FieldsConfig | null = null

  // Datos estáticos - NO MODIFICARR (opciones para seleccionar)
  public motorTestOptions = ['OD', 'OI', 'A.O.']

  public lensTypeOptions = [
    'monofocales',
    'bifocales',
    'progresivos',
    'acomodativos u ocupacionales',
  ]

  public additionalTreatmentOptions = [
    'fotocromático',
    'filtro de luz azul',
    'antireflejo',
    'blanco',
    'transition',
  ]

  ngOnInit(): void {}

  shouldShowSection(sectionKey: string): boolean {
    if (!this.fieldsConfig) {
      return true
    }
    const section = this.fieldsConfig.sections[sectionKey]
    const visible = section ? section.visible : true

    return visible
  }

  shouldShowField(sectionKey: string, fieldName: string): boolean {
    if (!this.fieldsConfig) {
      return true
    }
    const section = this.fieldsConfig.sections[sectionKey]
    if (!section || !section.visible) {
      return false
    }
    const fieldVisible = section.fields[fieldName] ?? true

    return fieldVisible
  }

  public getMotorTestControl(testType: string) {
    return this.formGroup.get(['motorTest', testType])
  }

  get lensTypesArray(): FormArray {
    return this.formGroup.get('lensTypes') as FormArray
  }

  public isLensTypeSelected(type: string): boolean {
    return this.lensTypesArray.value.includes(type)
  }

  public toggleLensType(type: string): void {
    const currentTypes = [...this.lensTypesArray.value]
    const index = currentTypes.indexOf(type)

    if (index > -1) {
      currentTypes.splice(index, 1)
    } else {
      currentTypes.push(type)
    }

    this.lensTypesArray.clear()
    currentTypes.forEach((lensType) => {
      this.lensTypesArray.push(new FormControl(lensType))
    })
  }

  get additionalTreatmentsArray(): FormArray {
    return this.formGroup.get('additionalTreatments') as FormArray
  }

  public isAdditionalTreatmentSelected(treatment: string): boolean {
    return this.additionalTreatmentsArray.value.includes(treatment)
  }

  public toggleAdditionalTreatment(treatment: string): void {
    const currentTreatments = [...this.additionalTreatmentsArray.value]
    const index = currentTreatments.indexOf(treatment)

    if (index > -1) {
      currentTreatments.splice(index, 1)
    } else {
      currentTreatments.push(treatment)
    }

    this.additionalTreatmentsArray.clear()
    currentTreatments.forEach((treat) => {
      this.additionalTreatmentsArray.push(new FormControl(treat))
    })
  }
}
