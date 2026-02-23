import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormGroup } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { FieldsConfig } from '@core/interfaces/api/clinical-form-config.interface'

@Component({
  selector: 'app-clinical-history-step3',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './clinical-history-step3.component.html',
  styleUrl: './clinical-history-step3.component.scss',
})
export class ClinicalHistoryStep3Component {
  @Input({ required: true }) formGroup!: FormGroup
  @Input() fieldsConfig: FieldsConfig | null = null

  ngOnInit(): void {
  }

  shouldShowSection(sectionKey: string): boolean {
    if (!this.fieldsConfig) return true
    const section = this.fieldsConfig.sections[sectionKey]
    return section ? section.visible : true
  }

  shouldShowField(sectionKey: string, fieldName: string): boolean {
    if (!this.fieldsConfig) return true
    const section = this.fieldsConfig.sections[sectionKey]
    if (!section || !section.visible) return false
    return section.fields[fieldName] ?? true
  }
}
