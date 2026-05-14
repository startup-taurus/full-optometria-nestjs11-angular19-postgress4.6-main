import { Component, Input, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { ClinicalHistory } from '@core/interfaces/api/clinical-history.interface'
import { ClinicalHistoriesService } from '@core/services/api/clinical-histories.service'

@Component({
  selector: 'app-view-medical-history',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './view-medical-history.component.html',
  styleUrls: ['./view-medical-history.component.scss'],
})
export class ViewMedicalHistoryComponent implements OnInit {
  @Input() clinicalHistoryId: string | null = null
  @Input() clinicalHistory: ClinicalHistory | null = null

  private _activeModal = inject(NgbActiveModal)
  private _clinicalHistoriesService = inject(ClinicalHistoriesService)

  public loading = false
  public currentStep = 1
  public totalSteps = 3
  public stepTitles = [
    'MEDICAL_HISTORY.PATIENT_GENERAL_DATA',
    'MEDICAL_HISTORY.MEASUREMENTS_AND_RX',
    'MEDICAL_HISTORY.DIAGNOSIS_AND_EXAMS',
  ]

  constructor() {}

  ngOnInit(): void {
    if (this.clinicalHistoryId && !this.clinicalHistory) {
      this.loadClinicalHistory()
    }
  }

  private async loadClinicalHistory(): Promise<void> {
    if (!this.clinicalHistoryId) return

    this.loading = true
    try {
      const result = await this._clinicalHistoriesService
        .getById(this.clinicalHistoryId)
        .toPromise()
      this.clinicalHistory = result || null
    } catch (error) {
      console.error('Error loading clinical history:', error)
    } finally {
      this.loading = false
    }
  }

  public goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step
    }
  }

  public goToNextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++
    }
  }

  public goToPreviousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--
    }
  }

  public canGoToNextStep(): boolean {
    return this.currentStep < this.totalSteps
  }

  public canGoToPreviousStep(): boolean {
    return this.currentStep > 1
  }

  public onClose(): void {
    this._activeModal.close()
  }

  public getMotorTestArray(): Array<{ name: string; data: any }> {
    if (!this.clinicalHistory?.motorTest) return []

    const motorTest = this.clinicalHistory.motorTest
    return [
      { name: 'Exoforia', data: motorTest.exophoria || { applies: false } },
      { name: 'Endoforia', data: motorTest.endophoria || { applies: false } },
      { name: 'Exotropia', data: motorTest.exotropia || { applies: false } },
      { name: 'Endotropia', data: motorTest.endotropia || { applies: false } },
      { name: 'Hiperforia', data: motorTest.hyperphoria || { applies: false } },
      { name: 'Hipertropia', data: motorTest.hypotropia || { applies: false } },
      { name: 'Alternante', data: motorTest.alternating || { applies: false } },
    ]
  }

  public getMotorTestDisplay(motorTest: any): string[] {
    if (!motorTest) return []

    const tests = []
    if (motorTest.exophoria?.applies)
      tests.push(
        `Exoforia - OD: ${motorTest.exophoria.od || 'N/A'}, OI: ${motorTest.exophoria.oi || 'N/A'}, Otros: ${motorTest.exophoria.value || 'N/A'}`
      )
    if (motorTest.endophoria?.applies)
      tests.push(
        `Endoforia - OD: ${motorTest.endophoria.od || 'N/A'}, OI: ${motorTest.endophoria.oi || 'N/A'}, Otros: ${motorTest.endophoria.value || 'N/A'}`
      )
    if (motorTest.exotropia?.applies)
      tests.push(
        `Exotropia - OD: ${motorTest.exotropia.od || 'N/A'}, OI: ${motorTest.exotropia.oi || 'N/A'}, Otros: ${motorTest.exotropia.value || 'N/A'}`
      )
    if (motorTest.endotropia?.applies)
      tests.push(
        `Endotropia - OD: ${motorTest.endotropia.od || 'N/A'}, OI: ${motorTest.endotropia.oi || 'N/A'}, Otros: ${motorTest.endotropia.value || 'N/A'}`
      )
    if (motorTest.hyperphoria?.applies)
      tests.push(
        `Hiperforia - OD: ${motorTest.hyperphoria.od || 'N/A'}, OI: ${motorTest.hyperphoria.oi || 'N/A'}, Otros: ${motorTest.hyperphoria.value || 'N/A'}`
      )
    if (motorTest.hypotropia?.applies)
      tests.push(
        `Hipertropia - OD: ${motorTest.hypotropia.od || 'N/A'}, OI: ${motorTest.hypotropia.oi || 'N/A'}, Otros: ${motorTest.hypotropia.value || 'N/A'}`
      )
    if (motorTest.alternating?.applies)
      tests.push(
        `Alternante - OD: ${motorTest.alternating.od || 'N/A'}, OI: ${motorTest.alternating.oi || 'N/A'}, Otros: ${motorTest.alternating.value || 'N/A'}`
      )

    return tests
  }

  public getLensTypesDisplay(lensTypes: string[]): string {
    if (!lensTypes || lensTypes.length === 0) return 'No seleccionados'
    return lensTypes
      .map((type) => type.charAt(0).toUpperCase() + type.slice(1))
      .join(', ')
  }

  public getAdditionalTreatmentsDisplay(treatments: string[]): string {
    if (!treatments || treatments.length === 0) return 'No seleccionados'
    return treatments
      .map((type) => type.charAt(0).toUpperCase() + type.slice(1))
      .join(', ')
  }

  public getPupillaryReflexDisplay(reflexes: any): string[] {
    if (!reflexes) return []

    const results = []
    if (reflexes.photomotor)
      results.push(
        `Fotomotor - OD: ${reflexes.photomotor.od || 'N/A'}, OI: ${reflexes.photomotor.oi || 'N/A'}`
      )
    if (reflexes.consensual)
      results.push(
        `Consensual - OD: ${reflexes.consensual.od || 'N/A'}, OI: ${reflexes.consensual.oi || 'N/A'}`
      )
    if (reflexes.accommodative)
      results.push(
        `Acomodativo - OD: ${reflexes.accommodative.od || 'N/A'}, OI: ${reflexes.accommodative.oi || 'N/A'}`
      )

    return results
  }

  public getRefractiveTestsDisplay(tests: any): string[] {
    if (!tests) return []

    const results = []
    if (tests.keratometry)
      results.push(
        `Queratometría - OD: ${tests.keratometry.od || 'N/A'}, OI: ${tests.keratometry.oi || 'N/A'}`
      )
    if (tests.autorefract)
      results.push(
        `Autorefracción - OD: ${tests.autorefract.od || 'N/A'}, OI: ${tests.autorefract.oi || 'N/A'}`
      )
    if (tests.refraction)
      results.push(
        `Refracción - OD: ${tests.refraction.od || 'N/A'}, OI: ${tests.refraction.oi || 'N/A'}`
      )
    if (tests.subjective)
      results.push(
        `Subjetivo - OD: ${tests.subjective.od || 'N/A'}, OI: ${tests.subjective.oi || 'N/A'}`
      )

    return results
  }
}
