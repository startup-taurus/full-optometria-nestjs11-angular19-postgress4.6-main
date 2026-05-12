import { Component, OnInit, OnDestroy, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgSelectModule } from '@ng-select/ng-select'
import { Subject, takeUntil } from 'rxjs'
import { Store } from '@ngrx/store'
import { ToastrService } from 'ngx-toastr'
import Swal from 'sweetalert2'
import {
  SWAL_DELETE_CONFIRM_CONFIG,
  SWAL_SUCCESS_CONFIG,
  SWAL_ERROR_CONFIG,
} from '@core/helpers/ui/ui.constants'

import { AppState } from '@core/states'
import { selectSelectedBranch } from '@core/states/branch/branch.selectors'
import { ClinicalFormConfigService } from '@core/services/api/clinical-form-config.service'
import { BranchService } from '@core/services/api/branch.service'
import { FieldVisibilityService } from '@core/services/ui/field-visibility.service'

import {
  ClinicalFormConfig,
  FieldsConfig,
  DEFAULT_CLINICAL_FORM_STRUCTURE,
  CLINICAL_FORM_LABELS,
  CreateClinicalFormConfigDto,
} from '@core/interfaces/api/clinical-form-config.interface'
import { Branch } from '@core/interfaces/api/user.interface'

@Component({
  selector: 'pages-medical-history-configuration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule],
  templateUrl: './pages-medical-history-configuration.component.html',
})
export class PagesMedicalHistoryConfigurationComponent
  implements OnInit, OnDestroy
{
  private destroy$ = new Subject<void>()

  private _store = inject(Store<AppState>)
  private _formBuilder = inject(FormBuilder)
  private _clinicalFormConfigService = inject(ClinicalFormConfigService)
  private _branchService = inject(BranchService)
  private _fieldVisibilityService = inject(FieldVisibilityService)
  private _translateService = inject(TranslateService)
  private _toastr = inject(ToastrService)

  public branches: Branch[] = []
  public selectedBranch: Branch | null = null
  public currentConfig: ClinicalFormConfig | null = null

  public configForm!: FormGroup

  public loading = false
  public saving = false

  public activeTab: 'step1' | 'step2' | 'step3' = 'step1'

  public readonly stepTabs: ReadonlyArray<{
    key: 'step1' | 'step2' | 'step3'
    icon: string
    translateKey: string
  }> = [
    {
      key: 'step1',
      icon: 'ti-user',
      translateKey: 'MEDICAL_HISTORY_CONFIG.STEP1_TITLE',
    },
    {
      key: 'step2',
      icon: 'ti-eye',
      translateKey: 'MEDICAL_HISTORY_CONFIG.STEP2_TITLE',
    },
    {
      key: 'step3',
      icon: 'ti-stethoscope',
      translateKey: 'MEDICAL_HISTORY_CONFIG.STEP3_TITLE',
    },
  ]

  public readonly LABELS = CLINICAL_FORM_LABELS
  public readonly DEFAULT_STRUCTURE = DEFAULT_CLINICAL_FORM_STRUCTURE

  ngOnInit(): void {
    this.initForm()
    this.loadBranches()
    this.subscribeToSelectedBranch()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initForm(): void {
    this.configForm = this._formBuilder.group({
      fieldsConfig: this._formBuilder.group({
        sections: this.createSectionsFormGroup(),
      }),
    })
  }

  private createSectionsFormGroup(): FormGroup {
    const sectionsGroup = this._formBuilder.group({})

    Object.entries(DEFAULT_CLINICAL_FORM_STRUCTURE.sections).forEach(
      ([sectionKey, section]) => {
        const fieldsGroup = this._formBuilder.group({})

        Object.keys(section.fields).forEach((fieldKey) => {
          fieldsGroup.addControl(fieldKey, this._formBuilder.control(true))
        })

        sectionsGroup.addControl(
          sectionKey,
          this._formBuilder.group({
            visible: [section.visible],
            fields: fieldsGroup,
          })
        )
      }
    )

    return sectionsGroup
  }

  private loadBranches(): void {
    this._branchService
      .getAllBranches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (branches: Branch[]) => {
          this.branches = branches
        },
        error: (error: any) => {},
      })
  }

  private subscribeToSelectedBranch(): void {
    this._store
      .select(selectSelectedBranch)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (branch) => {
          if (branch && branch.id !== this.selectedBranch?.id) {
            this.selectedBranch = branch
            this.loadConfigForBranch()
          }
        },
      })
  }

  private loadConfigForBranch(): void {
    if (!this.selectedBranch) return

    this.loading = true
    this._clinicalFormConfigService
      .getConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.currentConfig = config
          this.updateFormWithConfig(config)
          this.loading = false
        },
        error: (error) => {
          this.currentConfig = null
          this.resetFormToDefault()
          this.loading = false
        },
      })
  }

  private updateFormWithConfig(config: ClinicalFormConfig | null): void {
    if (config) {
      this.configForm.patchValue({
        fieldsConfig: config.fieldsConfig,
      })
    } else {
      this.resetFormToDefault()
    }
  }

  public resetFormToDefault(): void {
    this.configForm.patchValue({
      fieldsConfig: DEFAULT_CLINICAL_FORM_STRUCTURE,
    })
  }

  public initializeConfiguration(): void {
    if (!this.selectedBranch) return

    this.saving = true
    this._clinicalFormConfigService
      .initializeConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.currentConfig = response
          this.updateFormWithConfig(response)
          this.saving = false

          const currentLang = this._translateService.currentLang || 'es'
          const successMessage =
            response?.message?.[currentLang] ||
            this._translateService.instant(
              'MEDICAL_HISTORY_CONFIG.MESSAGES.INIT_SUCCESS'
            )
          this._toastr.success(successMessage)
        },
        error: (error) => {
          this.saving = false

          const currentLang = this._translateService.currentLang || 'es'
          const errorMessage =
            error?.error?.message?.[currentLang] ||
            this._translateService.instant('COMMON.ERROR_OCCURRED')
          this._toastr.error(errorMessage)
        },
      })
  }

  public saveConfiguration(): void {
    if (this.configForm.invalid || !this.selectedBranch || !this.currentConfig)
      return

    this.saving = true
    const formValue = this.configForm.value

    const dto: CreateClinicalFormConfigDto = {
      configName: 'clinical_history_form',
      fieldsConfig: formValue.fieldsConfig,
      isActive: true,
      version: this.currentConfig.version + 1,
    }

    this._clinicalFormConfigService
      .update(this.currentConfig.id, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.currentConfig = response
          this._fieldVisibilityService.clearCache()
          this.saving = false

          const currentLang = this._translateService.currentLang || 'es'
          const successMessage =
            response?.message?.[currentLang] ||
            this._translateService.instant(
              'MEDICAL_HISTORY_CONFIG.MESSAGES.SAVE_SUCCESS'
            )
          this._toastr.success(successMessage)
        },
        error: (error) => {
          this.saving = false

          const currentLang = this._translateService.currentLang || 'es'
          const errorMessage =
            error?.error?.message?.[currentLang] ||
            this._translateService.instant('COMMON.ERROR_OCCURRED')
          this._toastr.error(errorMessage)
        },
      })
  }

  public deleteConfiguration(): void {
    if (!this.currentConfig || !this.selectedBranch) return

    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: this._translateService.instant(
        'MEDICAL_HISTORY_CONFIG.MESSAGES.CONFIRM_DELETE_TITLE'
      ),
      text: this._translateService.instant(
        'MEDICAL_HISTORY_CONFIG.MESSAGES.CONFIRM_DELETE_TEXT'
      ),
      confirmButtonText: this._translateService.instant('COMMON.YES_DELETE'),
      cancelButtonText: this._translateService.instant('COMMON.CANCEL'),
    }).then((result) => {
      if (result.isConfirmed) {
        this.saving = true
        this._clinicalFormConfigService
          .delete(this.currentConfig!.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              this.currentConfig = null
              this.resetFormToDefault()
              this._fieldVisibilityService.clearCache()
              this.saving = false

              Swal.fire({
                ...SWAL_SUCCESS_CONFIG,
                title: this._translateService.instant('COMMON.DELETED'),
                text: this._translateService.instant(
                  'MEDICAL_HISTORY_CONFIG.MESSAGES.DELETE_SUCCESS'
                ),
              })
            },
            error: (error) => {
              this.saving = false

              const currentLang = this._translateService.currentLang || 'es'
              const errorMessage =
                error?.error?.message?.[currentLang] ||
                this._translateService.instant('COMMON.ERROR_OCCURRED')

              Swal.fire({
                ...SWAL_ERROR_CONFIG,
                title: this._translateService.instant('COMMON.ERROR'),
                text: errorMessage,
              })
            },
          })
      }
    })
  }

  public toggleSection(sectionKey: string, enabled: boolean): void {
    const sectionControl = this.configForm.get(
      `fieldsConfig.sections.${sectionKey}`
    )
    if (sectionControl) {
      sectionControl.get('visible')?.setValue(enabled)

      if (!enabled) {
        const fieldsGroup = sectionControl.get('fields') as FormGroup
        Object.keys(fieldsGroup.controls).forEach((fieldKey) => {
          fieldsGroup.get(fieldKey)?.setValue(false)
        })
      }
    }
  }

  public getSectionKeys(): string[] {
    return Object.keys(DEFAULT_CLINICAL_FORM_STRUCTURE.sections)
  }

  public getStep1Sections(): string[] {
    return this.getSectionKeys().filter((key) => key.startsWith('step1_'))
  }

  public getStep2Sections(): string[] {
    return this.getSectionKeys().filter((key) => key.startsWith('step2_'))
  }

  public getStep3Sections(): string[] {
    return this.getSectionKeys().filter((key) => key.startsWith('step3_'))
  }

  public getFieldKeys(sectionKey: string): string[] {
    return Object.keys(
      DEFAULT_CLINICAL_FORM_STRUCTURE.sections[sectionKey]?.fields || {}
    )
  }

  public isSectionVisible(sectionKey: string): boolean {
    return (
      this.configForm.get(`fieldsConfig.sections.${sectionKey}.visible`)
        ?.value || false
    )
  }

  public isFieldEnabled(sectionKey: string, fieldKey: string): boolean {
    return (
      this.configForm.get(
        `fieldsConfig.sections.${sectionKey}.fields.${fieldKey}`
      )?.value || false
    )
  }

  public setActiveTab(tab: 'step1' | 'step2' | 'step3'): void {
    this.activeTab = tab
  }

  public getSectionsByActiveTab(): string[] {
    return this.getSectionsByStep(this.activeTab)
  }

  public getEnabledSectionCount(step: 'step1' | 'step2' | 'step3'): number {
    return this.getSectionsByStep(step).filter((key) =>
      this.isSectionVisible(key)
    ).length
  }

  public getTotalSectionCount(step: 'step1' | 'step2' | 'step3'): number {
    return this.getSectionsByStep(step).length
  }

  private getSectionsByStep(step: 'step1' | 'step2' | 'step3'): string[] {
    switch (step) {
      case 'step1':
        return this.getStep1Sections()
      case 'step2':
        return this.getStep2Sections()
      case 'step3':
        return this.getStep3Sections()
    }
  }
}
