import { Injectable, inject } from '@angular/core'
import { Observable, of } from 'rxjs'
import { catchError, map, switchMap, distinctUntilChanged } from 'rxjs/operators'
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

  private readonly configCacheByBranch = new Map<string, FieldsConfig>()

  private mergeFieldsConfigWithDefaults(
    remoteConfig?: FieldsConfig | null
  ): FieldsConfig {
    if (!remoteConfig?.sections) {
      return DEFAULT_CLINICAL_FORM_STRUCTURE
    }

    const mergedSections: FieldsConfig['sections'] = {}

    Object.entries(DEFAULT_CLINICAL_FORM_STRUCTURE.sections).forEach(
      ([sectionKey, defaultSection]) => {
        const remoteSection = remoteConfig.sections[sectionKey]
        mergedSections[sectionKey] = {
          visible: remoteSection?.visible ?? defaultSection.visible,
          fields: {
            ...defaultSection.fields,
            ...(remoteSection?.fields ?? {}),
          },
        }
      }
    )

    Object.entries(remoteConfig.sections).forEach(([sectionKey, remoteSection]) => {
      if (!mergedSections[sectionKey]) {
        mergedSections[sectionKey] = remoteSection
      }
    })

    return {
      sections: mergedSections,
    }
  }

  getFieldsConfig(): Observable<FieldsConfig> {
    return this.store.select(selectSelectedBranchId).pipe(
      distinctUntilChanged(),
      switchMap((branchId) => {
        const cacheKey = branchId ?? '__no_branch__'
        const cachedConfig = this.configCacheByBranch.get(cacheKey)

        if (cachedConfig) {
          return of(cachedConfig)
        }

        return this.configService.getConfig().pipe(
          map((config: ClinicalFormConfig | null) => {
            const normalizedConfig = this.mergeFieldsConfigWithDefaults(
              config?.fieldsConfig
            )
            this.configCacheByBranch.set(cacheKey, normalizedConfig)
            return normalizedConfig
          }),
          catchError(() => {
            this.configCacheByBranch.set(cacheKey, DEFAULT_CLINICAL_FORM_STRUCTURE)
            return of(DEFAULT_CLINICAL_FORM_STRUCTURE)
          })
        )
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
    this.configCacheByBranch.clear()
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
