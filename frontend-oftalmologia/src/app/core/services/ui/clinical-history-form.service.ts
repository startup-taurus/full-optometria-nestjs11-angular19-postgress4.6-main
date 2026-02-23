import { Injectable } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { BehaviorSubject, Observable } from 'rxjs'
import { StorageService } from './storage.service'

export interface ClinicalHistoryFormData {
  userId: string

  occupation: string
  firstTime: boolean
  lastVisualExamDate: string
  visionProblems: string
  generalHealth: string
  otherHealthProblems: string
  segmentAnterior: string
  segmentAnteriorOther: string

  previousRxOd: string
  previousAddOd: string
  previousRxOi: string
  previousAddOi: string
  visualAcuityOdVl: string
  visualAcuityOdVp: string
  visualAcuityOiVl: string
  visualAcuityOiVp: string
  motorTest: any
  finalRxOdSphere: string
  finalRxOdCylinder: string
  finalRxOdAxis: string
  finalRxOdAdd: string
  finalRxOiSphere: string
  finalRxOiCylinder: string
  finalRxOiAxis: string
  finalRxOiAdd: string
  correctedAvOdVl: string
  correctedAvOdVp: string
  correctedAvOiVl: string
  correctedAvOiVp: string
  lensTypes: string[]
  professionalName: string

  pupillaryReflexes: any
  ophthalmoscopyOd: string
  ophthalmoscopyOi: string
  refractiveTests: any
  stereopsis: string
  worthTest: string
  otherNotes: string
  diagnosis: string
  disposition: string
}

@Injectable({
  providedIn: 'root',
})
export class ClinicalHistoryFormService {
  private readonly STORAGE_KEY = 'clinical_history_form_data'

  private formGroup!: FormGroup
  private currentStepSubject = new BehaviorSubject<number>(1)
  private stepValidationSubject = new BehaviorSubject<boolean[]>([
    false,
    false,
    false,
  ])
  private formDataSubject = new BehaviorSubject<
    Partial<ClinicalHistoryFormData>
  >({})

  public currentStep$ = this.currentStepSubject.asObservable()
  public stepValidation$ = this.stepValidationSubject.asObservable()
  public formData$ = this.formDataSubject.asObservable()

  constructor(
    private formBuilder: FormBuilder,
    private storageService: StorageService
  ) {
    this.initializeForm()
  }

  private initializeForm(): void {
    this.formGroup = this.formBuilder.group({
      userId: ['', Validators.required],

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

      motorTest: this.formBuilder.group({
        exophoria: this.formBuilder.group({
          checked: [false],
          applies: [''],
          value: [''],
        }),
        alternating: this.formBuilder.group({
          checked: [false],
          applies: [''],
          value: [''],
        }),
        endophoria: this.formBuilder.group({
          checked: [false],
          applies: [''],
          value: [''],
        }),
        exotropia: this.formBuilder.group({
          checked: [false],
          applies: [''],
          value: [''],
        }),
        endotropia: this.formBuilder.group({
          checked: [false],
          applies: [''],
          value: [''],
        }),
        hyperphoria: this.formBuilder.group({
          checked: [false],
          applies: [''],
          value: [''],
        }),
        hypotropia: this.formBuilder.group({
          checked: [false],
          applies: [''],
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

      lensTypes: [[]],

      professionalName: [''],

      pupillaryReflexes: this.formBuilder.group({
        photomotor: this.formBuilder.group({ od: [''], oi: [''] }),
        consensual: this.formBuilder.group({ od: [''], oi: [''] }),
        accommodative: this.formBuilder.group({ od: [''], oi: [''] }),
      }),

      ophthalmoscopyOd: [''],
      ophthalmoscopyOi: [''],

      refractiveTests: this.formBuilder.group({
        keratometry: this.formBuilder.group({ od: [''], oi: [''] }),
        autorefract: this.formBuilder.group({ od: [''], oi: [''] }),
        refraction: this.formBuilder.group({ od: [''], oi: [''] }),
        subjective: this.formBuilder.group({ od: [''], oi: [''] }),
      }),

      stereopsis: [''],
      worthTest: [''],
      otherNotes: [''],
      diagnosis: [''],
      disposition: [''],
    })

    this.formGroup.valueChanges.subscribe((value) => {
      this.saveToStorage(value)
      this.formDataSubject.next(value)
    })
  }

  public getFormGroup(): FormGroup {
    return this.formGroup
  }

  public nextStep(): boolean {
    const currentStep = this.currentStepSubject.value
    if (this.validateCurrentStep() && currentStep < 3) {
      this.updateStepValidation(currentStep - 1, true)
      this.currentStepSubject.next(currentStep + 1)
      return true
    }
    return false
  }

  public previousStep(): void {
    const currentStep = this.currentStepSubject.value
    if (currentStep > 1) {
      this.currentStepSubject.next(currentStep - 1)
    }
  }

  public goToStep(step: number): boolean {
    if (step >= 1 && step <= 3) {
      const stepValidation = this.stepValidationSubject.value
      for (let i = 0; i < step - 1; i++) {
        if (!stepValidation[i] && !this.validateStep(i + 1)) {
          return false
        }
      }
      this.currentStepSubject.next(step)
      return true
    }
    return false
  }

  public validateCurrentStep(): boolean {
    const currentStep = this.currentStepSubject.value
    return this.validateStep(currentStep)
  }

  public validateStep(step: number): boolean {
    switch (step) {
      case 1:
        const userIdControl = this.formGroup.get('userId')
        return !!userIdControl?.value

      case 2:
        return true

      case 3:
        return true

      default:
        return false
    }
  }

  public canProceedToNextStep(): boolean {
    return this.validateCurrentStep()
  }

  public canSave(): boolean {
    const currentStep = this.currentStepSubject.value
    return currentStep === 3 && this.validateCurrentStep()
  }

  private updateStepValidation(stepIndex: number, isValid: boolean): void {
    const validation = this.stepValidationSubject.value.slice()
    validation[stepIndex] = isValid
    this.stepValidationSubject.next(validation)
  }

  public getCurrentStep(): number {
    return this.currentStepSubject.value
  }

  public getStepClasses(step: number): string {
    const classes = ['step-indicator']
    const currentStep = this.currentStepSubject.value
    const stepValidation = this.stepValidationSubject.value

    if (step === currentStep) {
      classes.push('current')
    } else if (step < currentStep || stepValidation[step - 1]) {
      classes.push('completed')
    }

    return classes.join(' ')
  }

  private saveToStorage(data: any): void {
    try {
      this.storageService.secureStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(data)
      )
    } catch (error) {}
  }

  public loadFromStorage(): void {
    try {
      const savedDataString = this.storageService.secureStorage.getItem(
        this.STORAGE_KEY
      )
      if (savedDataString) {
        const savedData = JSON.parse(
          savedDataString
        ) as Partial<ClinicalHistoryFormData>
        this.formGroup.patchValue(savedData, { emitEvent: false })
        this.formDataSubject.next(savedData)
      }
    } catch (error) {}
  }

  public clearStorage(): void {
    try {
      this.storageService.secureStorage.removeItem(this.STORAGE_KEY)
      this.formGroup.reset()
      this.currentStepSubject.next(1)
      this.stepValidationSubject.next([false, false, false])
      this.formDataSubject.next({})
    } catch (error) {}
  }

  public setEditMode(data: any): void {
    this.clearStorage()

    let motorTestFormValue: any = {}
    if (data.motorTest) {
      const motorTestKeys = [
        'exophoria',
        'endophoria',
        'exotropia',
        'endotropia',
        'hyperphoria',
        'hypotropia',
        'alternating',
      ]
      motorTestKeys.forEach((key) => {
        const testItem = (data?.motorTest as any)?.[key]
        if (testItem) {
          motorTestFormValue[key] = {
            checked: true,
            applies: testItem.applies || '',
            value: testItem.value || '',
          }
        }
      })
    }

    this.formGroup.patchValue({
      userId: data.userId,
      occupation: '',
      firstTime: !data.lastVisualExamDate,
      lastVisualExamDate: data.lastVisualExamDate
        ? new Date(data.lastVisualExamDate).toISOString().split('T')[0]
        : '',
      visionProblems: data.visionProblems,
      generalHealth: data.generalHealth,
      otherHealthProblems: data.otherHealthProblems,
      segmentAnterior: data.segmentAnterior,
      segmentAnteriorOther: '',

      previousRxOd: data.previousRxOd,
      previousAddOd: data.previousAddOd,
      previousRxOi: data.previousRxOi,
      previousAddOi: data.previousAddOi,

      visualAcuityOdVl: data.visualAcuityOdVl,
      visualAcuityOdVp: data.visualAcuityOdVp,
      visualAcuityOiVl: data.visualAcuityOiVl,
      visualAcuityOiVp: data.visualAcuityOiVp,

      motorTest: motorTestFormValue,

      finalRxOdSphere: data.finalRxOdSphere,
      finalRxOdCylinder: data.finalRxOdCylinder,
      finalRxOdAxis: data.finalRxOdAxis,
      finalRxOdAdd: data.finalRxOdAdd,
      finalRxOiSphere: data.finalRxOiSphere,
      finalRxOiCylinder: data.finalRxOiCylinder,
      finalRxOiAxis: data.finalRxOiAxis,
      finalRxOiAdd: data.finalRxOiAdd,

      correctedAvOdVl: data.correctedAvOdVl,
      correctedAvOdVp: data.correctedAvOdVp,
      correctedAvOiVl: data.correctedAvOiVl,
      correctedAvOiVp: data.correctedAvOiVp,

      lensTypes: data.lensTypes || [],

      professionalName: data.professionalName,

      pupillaryReflexes: data.pupillaryReflexes,

      ophthalmoscopyOd: data.ophthalmoscopyOd,
      ophthalmoscopyOi: data.ophthalmoscopyOi,

      refractiveTests: data.refractiveTests,

      stereopsis: data.stereopsis,
      worthTest: data.worthTest,
      otherNotes: data.otherNotes,
      diagnosis: data.diagnosis,
      disposition: data.disposition,
    })

    this.stepValidationSubject.next([true, true, true])
  }

  public getMappedFormData(): any {
    const formValue = this.formGroup.value

    const motorTestMapped: any = {}
    if (formValue.motorTest) {
      Object.keys(formValue.motorTest).forEach((key) => {
        const testItem = formValue.motorTest[key]
        if (testItem.checked && (testItem.applies || testItem.value)) {
          motorTestMapped[key] = {
            applies: testItem.applies,
            value: testItem.value,
          }
        }
      })
    }

    return {
      userId: formValue.userId,
      professionalName: formValue.professionalName || undefined,
      lastVisualExamDate: formValue.firstTime
        ? undefined
        : formValue.lastVisualExamDate || undefined,
      visionProblems: formValue.visionProblems || undefined,
      generalHealth: formValue.generalHealth || undefined,
      otherHealthProblems: formValue.otherHealthProblems || undefined,
      segmentAnterior: formValue.segmentAnterior || undefined,

      previousRxOd: formValue.previousRxOd || undefined,
      previousAddOd: formValue.previousAddOd || undefined,
      previousRxOi: formValue.previousRxOi || undefined,
      previousAddOi: formValue.previousAddOi || undefined,

      visualAcuityOdVl: formValue.visualAcuityOdVl || undefined,
      visualAcuityOdVp: formValue.visualAcuityOdVp || undefined,
      visualAcuityOiVl: formValue.visualAcuityOiVl || undefined,
      visualAcuityOiVp: formValue.visualAcuityOiVp || undefined,

      motorTest:
        Object.keys(motorTestMapped).length > 0 ? motorTestMapped : undefined,

      finalRxOdSphere: formValue.finalRxOdSphere || undefined,
      finalRxOdCylinder: formValue.finalRxOdCylinder || undefined,
      finalRxOdAxis: formValue.finalRxOdAxis || undefined,
      finalRxOdAdd: formValue.finalRxOdAdd || undefined,
      finalRxOiSphere: formValue.finalRxOiSphere || undefined,
      finalRxOiCylinder: formValue.finalRxOiCylinder || undefined,
      finalRxOiAxis: formValue.finalRxOiAxis || undefined,
      finalRxOiAdd: formValue.finalRxOiAdd || undefined,

      correctedAvOdVl: formValue.correctedAvOdVl || undefined,
      correctedAvOdVp: formValue.correctedAvOdVp || undefined,
      correctedAvOiVl: formValue.correctedAvOiVl || undefined,
      correctedAvOiVp: formValue.correctedAvOiVp || undefined,

      lensTypes:
        formValue.lensTypes && formValue.lensTypes.length > 0
          ? formValue.lensTypes
          : undefined,

      pupillaryReflexes: formValue.pupillaryReflexes || undefined,

      ophthalmoscopyOd: formValue.ophthalmoscopyOd || undefined,
      ophthalmoscopyOi: formValue.ophthalmoscopyOi || undefined,

      refractiveTests: formValue.refractiveTests || undefined,

      stereopsis: formValue.stereopsis || undefined,
      worthTest: formValue.worthTest || undefined,
      otherNotes: formValue.otherNotes || undefined,
      diagnosis: formValue.diagnosis || undefined,
      disposition: formValue.disposition || undefined,
    }
  }
}
