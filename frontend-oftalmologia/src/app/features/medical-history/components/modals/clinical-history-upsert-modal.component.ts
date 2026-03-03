import { Component, OnInit, OnDestroy, Input, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  FormArray,
  Validators,
} from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgSelectModule } from '@ng-select/ng-select'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Subject, takeUntil } from 'rxjs'
import { ToastrService } from 'ngx-toastr'
import { ClinicalHistoriesService } from '@core/services/api/clinical-histories.service'
import { FieldVisibilityService } from '@core/services/ui/field-visibility.service'
import { FieldsConfig } from '@core/interfaces/api/clinical-form-config.interface'
import { BaseStepModalComponent } from '../../../../shared/components/base-step-modal/base-step-modal.component'
import { ClinicalHistoryStep1Component } from '../steps/clinical-history-step1/clinical-history-step1.component'
import { ClinicalHistoryStep2Component } from '../steps/clinical-history-step2/clinical-history-step2.component'
import { ClinicalHistoryStep3Component } from '../steps/clinical-history-step3/clinical-history-step3.component'

import {
  ClinicalHistory,
  CreateClinicalHistoryDto,
  UpdateClinicalHistoryDto,
} from '@core/interfaces/api/clinical-history.interface'

@Component({
  selector: 'app-clinical-history-upsert-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    NgSelectModule,
    BaseStepModalComponent,
    ClinicalHistoryStep1Component,
    ClinicalHistoryStep2Component,
    ClinicalHistoryStep3Component,
  ],
  templateUrl: './clinical-history-upsert-modal.component.html',
  styleUrls: ['./clinical-history-upsert-modal.component.scss'],
})
export class ClinicalHistoryUpsertModalComponent implements OnInit, OnDestroy {
  @Input() editMode = false
  @Input() selectedRecord: ClinicalHistory | null = null
  @Input() recordId?: string
  @Input() preSelectedPatientId?: string
  @Input() fromShiftFlow = false
  @Input() sourceShiftId?: string

  private destroySilentlyContinue = new Subject<void>()

  private _activeModal = inject(NgbActiveModal)
  private _clinicalHistoriesService = inject(ClinicalHistoriesService)
  private _formBuilder = inject(FormBuilder)
  private _translateService = inject(TranslateService)
  private _fieldVisibilityService = inject(FieldVisibilityService)
  private _toastr = inject(ToastrService)

  public clinicalForm!: FormGroup
  public saving = false
  public fieldsConfig: FieldsConfig | null = null

  public currentStep = 1
  public totalSteps = 3

  public stepTitles: string[] = []

  ngOnInit(): void {
    this.loadStepTitles()
    this.initializeForm()
    this.loadFieldsConfiguration()
    this.loadExistingData()
  }

  ngOnDestroy(): void {
    this.destroySilentlyContinue.next()
    this.destroySilentlyContinue.complete()
  }

  private loadStepTitles(): void {
    this.stepTitles = [
      this._translateService.instant('MEDICAL_HISTORY.PATIENT_GENERAL_DATA'),
      this._translateService.instant('MEDICAL_HISTORY.MEASUREMENTS_AND_RX'),
      this._translateService.instant('MEDICAL_HISTORY.DIAGNOSIS_AND_EXAMS'),
    ]
  }

  private loadFieldsConfiguration(): void {
    this._fieldVisibilityService
      .getFieldsConfig()
      .pipe(takeUntil(this.destroySilentlyContinue))
      .subscribe({
        next: (config) => {
          this.fieldsConfig = config
        },
        error: (error) => {},
      })
  }

  private initializeForm(): void {
    this.clinicalForm = this._formBuilder.group({
      patientId: ['', Validators.required],
      professionalName: [''],
      occupation: [''],
      firstTime: [false],
      lastVisualExamDate: [''],
      visionProblems: [''],
      generalHealth: [''],
      otherHealthProblems: [''],
      segmentAnterior: [''],
      segmentAnteriorOther: [''],

      previousRxOd: [''],
      previousAddOd: [''],
      previousRxOi: [''],
      previousAddOi: [''],

      visualAcuityOdVl: [''],
      visualAcuityOdVp: [''],
      visualAcuityOiVl: [''],
      visualAcuityOiVp: [''],

      motorTest: this._formBuilder.group({
        exophoria: this._formBuilder.group({
          applies: [''],
          od: [''],
          oi: [''],
          value: [''],
        }),
        endophoria: this._formBuilder.group({
          applies: [''],
          od: [''],
          oi: [''],
          value: [''],
        }),
        exotropia: this._formBuilder.group({
          applies: [''],
          od: [''],
          oi: [''],
          value: [''],
        }),
        endotropia: this._formBuilder.group({
          applies: [''],
          od: [''],
          oi: [''],
          value: [''],
        }),
        hyperphoria: this._formBuilder.group({
          applies: [''],
          od: [''],
          oi: [''],
          value: [''],
        }),
        hypotropia: this._formBuilder.group({
          applies: [''],
          od: [''],
          oi: [''],
          value: [''],
        }),
        alternating: this._formBuilder.group({
          applies: [''],
          od: [''],
          oi: [''],
          value: [''],
        }),
      }),

      finalRxOdSphere: [''],
      finalRxOdCylinder: [''],
      finalRxOdAxis: [''],
      finalRxOdAdd: [''],
      finalRxOiSphere: [''],
      finalRxOiCylinder: [''],
      finalRxOiAxis: [''],
      finalRxOiAdd: [''],

      correctedAvOdVl: [''],
      correctedAvOdVp: [''],
      correctedAvOiVl: [''],
      correctedAvOiVp: [''],

      lensTypes: this._formBuilder.array([]),
      additionalTreatments: this._formBuilder.array([]),

      pupillaryReflexes: this._formBuilder.group({
        photomotor: this._formBuilder.group({
          od: [''],
          oi: [''],
        }),
        consensual: this._formBuilder.group({
          od: [''],
          oi: [''],
        }),
        accommodative: this._formBuilder.group({
          od: [''],
          oi: [''],
        }),
      }),

      ophthalmoscopyOd: [''],
      ophthalmoscopyOi: [''],

      refractiveTests: this._formBuilder.group({
        keratometry: this._formBuilder.group({
          od: [''],
          oi: [''],
        }),
        autorefract: this._formBuilder.group({
          od: [''],
          oi: [''],
        }),
        refraction: this._formBuilder.group({
          od: [''],
          oi: [''],
        }),
        subjective: this._formBuilder.group({
          od: [''],
          oi: [''],
        }),
      }),

      stereopsis: [''],
      worthTest: [''],
      otherNotes: [''],
      diagnosis: [''],
      disposition: [''],
    })
  }

  private loadExistingData(): void {
    if (this.editMode) {
      if (this.selectedRecord) {

        this.populateFormFromRecord(this.selectedRecord)
      } else if (this.recordId) {

        this.loadRecordFromBackend(this.recordId)
      }
    }
  }

  private loadRecordFromBackend(recordId: string): void {
    this._clinicalHistoriesService
      .getById(recordId)
      .pipe(takeUntil(this.destroySilentlyContinue))
      .subscribe({
        next: (record: ClinicalHistory | null) => {
          if (record) {
            this.selectedRecord = record
            this.populateFormFromRecord(record)
          } else {
          }
        },
        error: (error) => {
        },
      })
  }

  public populateFormFromRecord(record: ClinicalHistory): void {

    this.clinicalForm.patchValue({
      patientId: record.patientId || '',
      professionalName: record.professionalName || '',
      occupation: record.occupation || '',
      firstTime: record.firstTime || false,
      lastVisualExamDate: this.formatDateForInput(record.lastVisualExamDate),
      visionProblems: record.visionProblems || '',
      generalHealth: record.generalHealth || '',
      otherHealthProblems: record.otherHealthProblems || '',
      segmentAnterior: record.segmentAnterior || '',
      segmentAnteriorOther: record.segmentAnteriorOther || '',

      previousRxOd: record.previousRxOd || '',
      previousAddOd: record.previousAddOd || '',
      previousRxOi: record.previousRxOi || '',
      previousAddOi: record.previousAddOi || '',

      visualAcuityOdVl: record.visualAcuityOdVl || '',
      visualAcuityOdVp: record.visualAcuityOdVp || '',
      visualAcuityOiVl: record.visualAcuityOiVl || '',
      visualAcuityOiVp: record.visualAcuityOiVp || '',

      finalRxOdSphere: record.finalRxOdSphere || '',
      finalRxOdCylinder: record.finalRxOdCylinder || '',
      finalRxOdAxis: record.finalRxOdAxis || '',
      finalRxOdAdd: record.finalRxOdAdd || '',
      finalRxOiSphere: record.finalRxOiSphere || '',
      finalRxOiCylinder: record.finalRxOiCylinder || '',
      finalRxOiAxis: record.finalRxOiAxis || '',
      finalRxOiAdd: record.finalRxOiAdd || '',

      correctedAvOdVl: record.correctedAvOdVl || '',
      correctedAvOdVp: record.correctedAvOdVp || '',
      correctedAvOiVl: record.correctedAvOiVl || '',
      correctedAvOiVp: record.correctedAvOiVp || '',

      ophthalmoscopyOd: record.ophthalmoscopyOd || '',
      ophthalmoscopyOi: record.ophthalmoscopyOi || '',

      stereopsis: record.stereopsis || '',
      worthTest: record.worthTest || '',
      otherNotes: record.otherNotes || '',
      diagnosis: record.diagnosis || '',
      disposition: record.disposition || '',
    })

    if (record.motorTest) {
      const motorTestPatch: any = {}
      const motorTestTypes = [
        'exophoria',
        'endophoria',
        'exotropia',
        'endotropia',
        'hyperphoria',
        'hypotropia',
        'alternating',
      ]

      motorTestTypes.forEach((testType) => {
        if (record.motorTest?.[testType as keyof typeof record.motorTest]) {
          const testData =
            record.motorTest[testType as keyof typeof record.motorTest]
          motorTestPatch[testType] = {
            applies: testData?.applies || '',
            od: testData?.od || '',
            oi: testData?.oi || '',
            value: testData?.value || '',
          }
        }
      })

      this.clinicalForm.get('motorTest')?.patchValue(motorTestPatch)
    }

    if (record.pupillaryReflexes) {
      this.clinicalForm.get('pupillaryReflexes')?.patchValue({
        photomotor: {
          od: record.pupillaryReflexes.photomotor?.od || '',
          oi: record.pupillaryReflexes.photomotor?.oi || '',
        },
        consensual: {
          od: record.pupillaryReflexes.consensual?.od || '',
          oi: record.pupillaryReflexes.consensual?.oi || '',
        },
        accommodative: {
          od: record.pupillaryReflexes.accommodative?.od || '',
          oi: record.pupillaryReflexes.accommodative?.oi || '',
        },
      })
    }

    if (record.refractiveTests) {
      this.clinicalForm.get('refractiveTests')?.patchValue({
        keratometry: {
          od: record.refractiveTests.keratometry?.od || '',
          oi: record.refractiveTests.keratometry?.oi || '',
        },
        autorefract: {
          od: record.refractiveTests.autorefract?.od || '',
          oi: record.refractiveTests.autorefract?.oi || '',
        },
        refraction: {
          od: record.refractiveTests.refraction?.od || '',
          oi: record.refractiveTests.refraction?.oi || '',
        },
        subjective: {
          od: record.refractiveTests.subjective?.od || '',
          oi: record.refractiveTests.subjective?.oi || '',
        },
      })
    }

    if (record.lensTypes && Array.isArray(record.lensTypes)) {
      const lensTypesArray = this.clinicalForm.get('lensTypes') as FormArray
      lensTypesArray.clear()

      record.lensTypes.forEach((lensType) => {
        lensTypesArray.push(this._formBuilder.control(lensType))
      })
    }

    if (
      record.additionalTreatments &&
      Array.isArray(record.additionalTreatments)
    ) {
      const additionalTreatmentsArray = this.clinicalForm.get(
        'additionalTreatments'
      ) as FormArray
      additionalTreatmentsArray.clear()

      record.additionalTreatments.forEach((treatment) => {
        additionalTreatmentsArray.push(this._formBuilder.control(treatment))
      })
    }
  }

  public canGoToNextStep(): boolean {
    switch (this.currentStep) {
      case 1:
        const hasValidPatient = this.clinicalForm.get('patientId')?.valid || false
        return hasValidPatient
      case 2:
        return true
      case 3:
        return true
      default:
        return false
    }
  }

  public canGoToPreviousStep(): boolean {
    return this.currentStep > 1
  }

  public goToNextStep(): void {
    if (this.canGoToNextStep() && this.currentStep < this.totalSteps) {
      this.currentStep++
    }
  }

  public goToPreviousStep(): void {
    if (this.canGoToPreviousStep()) {
      this.currentStep--
    }
  }

  public goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      if (step > 1 && !this.clinicalForm.get('patientId')?.valid) {
        return
      }
      this.currentStep = step
    }
  }

  public async onSubmit(): Promise<void> {
    const patientIdControl = this.clinicalForm.get('patientId')
    if (!patientIdControl?.valid) {
      patientIdControl?.markAsTouched()
      return
    }

    this.saving = true
    try {
      const formData = this.clinicalForm.value
      const dto = this.buildCreateUpdateDto(formData)

      if (this.editMode && this.selectedRecord?.id) {
        const updateDto: UpdateClinicalHistoryDto = dto
        const response: any = await this._clinicalHistoriesService
          .update(this.selectedRecord.id, updateDto)
          .toPromise()

        const currentLang = this._translateService.currentLang || 'es'
        const successMessage =
          response?.message?.[currentLang] ||
          this._translateService.instant(
            'MEDICAL_HISTORY.MESSAGES.UPDATE_SUCCESS'
          )
        this._toastr.success(successMessage)
      } else {
        const createDto: CreateClinicalHistoryDto = {
          ...dto,
          ...(this.fromShiftFlow && this.sourceShiftId
            ? {
                fromShiftFlow: true,
                sourceShiftId: this.sourceShiftId,
              }
            : {}),
        }
        const response: any = await this._clinicalHistoriesService
          .create(createDto)
          .toPromise()

        const currentLang = this._translateService.currentLang || 'es'
        const successMessage =
          response?.message?.[currentLang] ||
          this._translateService.instant(
            'MEDICAL_HISTORY.MESSAGES.CREATE_SUCCESS'
          )
        this._toastr.success(successMessage)
      }

      this._activeModal.close(true)
    } catch (error: any) {
      const currentLang = this._translateService.currentLang || 'es'
      const errorMessage =
        error?.error?.message?.[currentLang] ||
        this._translateService.instant('COMMON.ERROR_OCCURRED')
      this._toastr.error(errorMessage)
    } finally {
      this.saving = false
    }
  }

  public onCancel(): void {
    this._activeModal.dismiss(false)
  }

  get lensTypesArray(): FormArray {
    return this.clinicalForm.get('lensTypes') as FormArray
  }

  public isLensTypeSelected(type: string): boolean {
    return this.lensTypesArray.value.includes(type)
  }

  public toggleLensType(type: string): void {
    const currentTypes = this.lensTypesArray.value
    const index = currentTypes.indexOf(type)

    if (index > -1) {
      this.lensTypesArray.removeAt(index)
    } else {
      this.lensTypesArray.push(this._formBuilder.control(type))
    }
  }

  get additionalTreatmentsArray(): FormArray {
    return this.clinicalForm.get('additionalTreatments') as FormArray
  }

  public isAdditionalTreatmentSelected(treatment: string): boolean {
    return this.additionalTreatmentsArray.value.includes(treatment)
  }

  public toggleAdditionalTreatment(treatment: string): void {
    const currentTreatments = this.additionalTreatmentsArray.value
    const index = currentTreatments.indexOf(treatment)

    if (index > -1) {
      this.additionalTreatmentsArray.removeAt(index)
    } else {
      this.additionalTreatmentsArray.push(this._formBuilder.control(treatment))
    }
  }

  private buildCreateUpdateDto(formData: any): any {
    return {
      patientId: formData.patientId,
      professionalName: formData.professionalName,
      occupation: formData.occupation,
      firstTime: formData.firstTime,
      lastVisualExamDate: this.formatDateForBackend(
        formData.lastVisualExamDate
      ),
      visionProblems: formData.visionProblems,
      generalHealth: formData.generalHealth,
      otherHealthProblems: formData.otherHealthProblems,
      segmentAnterior: formData.segmentAnterior,
      segmentAnteriorOther: formData.segmentAnteriorOther,

      previousRxOd: formData.previousRxOd,
      previousAddOd: formData.previousAddOd,
      previousRxOi: formData.previousRxOi,
      previousAddOi: formData.previousAddOi,

      visualAcuityOdVl: formData.visualAcuityOdVl,
      visualAcuityOdVp: formData.visualAcuityOdVp,
      visualAcuityOiVl: formData.visualAcuityOiVl,
      visualAcuityOiVp: formData.visualAcuityOiVp,

      motorTest: formData.motorTest,

      finalRxOdSphere: formData.finalRxOdSphere,
      finalRxOdCylinder: formData.finalRxOdCylinder,
      finalRxOdAxis: formData.finalRxOdAxis,
      finalRxOdAdd: formData.finalRxOdAdd,
      finalRxOiSphere: formData.finalRxOiSphere,
      finalRxOiCylinder: formData.finalRxOiCylinder,
      finalRxOiAxis: formData.finalRxOiAxis,
      finalRxOiAdd: formData.finalRxOiAdd,

      correctedAvOdVl: formData.correctedAvOdVl,
      correctedAvOdVp: formData.correctedAvOdVp,
      correctedAvOiVl: formData.correctedAvOiVl,
      correctedAvOiVp: formData.correctedAvOiVp,

      lensTypes: formData.lensTypes,
      additionalTreatments: formData.additionalTreatments,

      pupillaryReflexes: formData.pupillaryReflexes,

      ophthalmoscopyOd: formData.ophthalmoscopyOd,
      ophthalmoscopyOi: formData.ophthalmoscopyOi,

      refractiveTests: formData.refractiveTests,

      stereopsis: formData.stereopsis,
      worthTest: formData.worthTest,
      otherNotes: formData.otherNotes,
      diagnosis: formData.diagnosis,
      disposition: formData.disposition,
    }
  }

  private markNestedFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key)
      if (control) {
        control.markAsTouched()
        if (control instanceof FormGroup) {
          this.markNestedFormGroupTouched(control)
        }
      }
    })
  }

  private formatDateForInput(date: Date | string | null | undefined): string {
    if (!date) {
      return ''
    }

    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        return ''
      }

      const year = dateObj.getFullYear()
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getDate()).padStart(2, '0')

      return `${year}-${month}-${day}`
    } catch (error) {
      return ''
    }
  }

  private formatDateForBackend(date: string | null | undefined): string | null {
    if (!date || date.trim() === '') {
      return null
    }

    try {
      const [year, month, day] = date.split('-').map((num) => parseInt(num, 10))
      const dateObj = new Date(year, month - 1, day)

      if (isNaN(dateObj.getTime())) {
        return null
      }

      return dateObj.toISOString()
    } catch (error) {
      return null
    }
  }
}
