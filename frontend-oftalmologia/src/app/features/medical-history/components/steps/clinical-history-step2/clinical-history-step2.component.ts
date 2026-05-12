import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { ReactiveFormsModule, FormGroup } from '@angular/forms'
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
  @Input() duplicateMode = false
  @Input() originalFormValue: Record<string, any> | null = null

  public motorTestOptions = ['OD', 'OI', 'A.O.']

  shouldShowSection(sectionKey: string): boolean {
    if (!this.fieldsConfig) {
      return true
    }
    const section = this.fieldsConfig.sections[sectionKey]
    return section ? section.visible : true
  }

  shouldShowField(sectionKey: string, fieldName: string): boolean {
    if (!this.fieldsConfig) {
      return true
    }
    const section = this.fieldsConfig.sections[sectionKey]
    if (!section || !section.visible) {
      return false
    }
    return section.fields[fieldName] ?? true
  }

  public getMotorTestControl(testType: string) {
    return this.formGroup.get(['motorTest', testType])
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
