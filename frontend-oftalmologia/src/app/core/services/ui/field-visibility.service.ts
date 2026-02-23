import { Injectable, inject } from '@angular/core'
import { Observable, BehaviorSubject, of } from 'rxjs'
import { tap, catchError, map, switchMap } from 'rxjs/operators'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { selectSelectedBranchId } from '@core/states/branch/branch.selectors'
import { ClinicalFormConfigService } from '../api/clinical-form-config.service'
import {
  ClinicalFormConfig,
  FieldsConfig,
  DEFAULT_CLINICAL_FORM_STRUCTURE,
} from '@core/interfaces/api/clinical-form-config.interface'

@Injectable({
  providedIn: 'root',
})
export class FieldVisibilityService {
  private store = inject(Store<AppState>)
  private configService = inject(ClinicalFormConfigService)

  private configCache$ = new BehaviorSubject<FieldsConfig | null>(null)
  private currentBranchId: string | null = null

  constructor() {
    this.subscribeTobranchChanges()
  }

  private subscribeTobranchChanges(): void {
    this.store.select(selectSelectedBranchId).subscribe({
      next: (branchId) => {
        if (branchId !== this.currentBranchId) {
          this.currentBranchId = branchId
          this.configCache$.next(null)
        }
      },
    })
  }

  getFieldsConfig(): Observable<FieldsConfig> {
    const cachedConfig = this.configCache$.value
    if (cachedConfig) {
      return of(cachedConfig)
    }

    return this.configService.getConfig().pipe(
      map((config: ClinicalFormConfig | null) => {
        if (config && config.fieldsConfig) {
          this.configCache$.next(config.fieldsConfig)
          return config.fieldsConfig
        } else {
          this.configCache$.next(DEFAULT_CLINICAL_FORM_STRUCTURE)
          return DEFAULT_CLINICAL_FORM_STRUCTURE
        }
      }),
      catchError((error) => {
        this.configCache$.next(DEFAULT_CLINICAL_FORM_STRUCTURE)
        return of(DEFAULT_CLINICAL_FORM_STRUCTURE)
      })
    )
  }

  isSectionVisible(sectionKey: string): Observable<boolean> {
    return this.getFieldsConfig().pipe(
      map((config) => {
        const section = config.sections[sectionKey]
        return section ? section.visible : true
      })
    )
  }

  isFieldVisible(sectionKey: string, fieldKey: string): Observable<boolean> {
    return this.getFieldsConfig().pipe(
      map((config) => {
        const section = config.sections[sectionKey]
        if (!section || !section.visible) {
          return false
        }
        return section.fields[fieldKey] ?? true
      })
    )
  }

  clearCache(): void {
    this.configCache$.next(null)
  }

  getSectionsByStep(step: number): string[] {
    const sections: Record<number, string[]> = {
      1: ['step1_personalData'],
      2: [
        'step2_previousRx',
        'step2_visualAcuity',
        'step2_motorTest',
        'step2_finalRx',
        'step2_lensTypes',
        'step2_additionalTreatments',
        'step2_professionalName',
      ],
      3: [
        'step3_pupillaryReflexes',
        'step3_ophthalmoscopy',
        'step3_refractiveTests',
        'step3_otherExams',
        'step3_diagnosisAndDisposition',
      ],
    }
    return sections[step] || []
  }
}
