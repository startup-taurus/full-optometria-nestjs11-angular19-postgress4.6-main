import { AfterViewInit, Component, Input } from '@angular/core'
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
export class ClinicalHistoryStep2Component implements AfterViewInit {
  @Input({ required: true }) formGroup!: FormGroup
  @Input() fieldsConfig: FieldsConfig | null = null
  @Input() duplicateMode = false
  @Input() originalFormValue: Record<string, any> | null = null

  private initialLensTypes = new Set<string>()
  private initialAdditionalTreatments = new Set<string>()

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

  ngAfterViewInit(): void {
    this.captureInitialSelections()
  }

  private captureInitialSelections(): void {
    this.initialLensTypes = new Set(this.lensTypesArray.value || [])
    this.initialAdditionalTreatments = new Set(
      this.additionalTreatmentsArray.value || []
    )
  }

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
    this.lensTypesArray.markAsDirty()
    this.lensTypesArray.updateValueAndValidity({ emitEvent: false })
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
    this.additionalTreatmentsArray.markAsDirty()
    this.additionalTreatmentsArray.updateValueAndValidity({ emitEvent: false })
  }

  public isLensTypeModified(type: string): boolean {
    if (!this.duplicateMode) {
      return false
    }

    return this.initialLensTypes.has(type) !== this.isLensTypeSelected(type)
  }

  public isAdditionalTreatmentModified(treatment: string): boolean {
    if (!this.duplicateMode) {
      return false
    }

    return (
      this.initialAdditionalTreatments.has(treatment) !==
      this.isAdditionalTreatmentSelected(treatment)
    )
  }

  public shouldShowOriginalValue(path: string): boolean {
    if (!this.duplicateMode) {
      return false
    }

    return this.getOriginalValue(path) !== null
  }

  public getOriginalValue(path: string): string | null {
    return this.normalizeValue(this.getValueByPath(this.originalFormValue, path))
  }

  public isOriginalValueModified(path: string): boolean {
    if (!this.duplicateMode) {
      return false
    }

    const originalRaw = this.getValueByPath(this.originalFormValue, path)
    const normalizedOriginal = this.normalizeValue(originalRaw)
    if (normalizedOriginal === null) {
      return false
    }

    const currentValue = this.formGroup.get(path)?.value
    return !this.areValuesEqual(currentValue, originalRaw)
  }

  private getValueByPath(source: any, path: string): any {
    if (!source || !path) {
      return undefined
    }

    return path.split('.').reduce((acc, key) => acc?.[key], source)
  }

  private normalizeValue(value: any): string | null {
    if (value === null || value === undefined) {
      return null
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : null
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    }

    if (typeof value === 'number') {
      return String(value)
    }

    if (typeof value === 'boolean') {
      return value ? 'Si' : 'No'
    }

    return String(value)
  }

  private areValuesEqual(currentValue: any, originalValue: any): boolean {
    return JSON.stringify(currentValue ?? null) === JSON.stringify(originalValue ?? null)
  }
}
