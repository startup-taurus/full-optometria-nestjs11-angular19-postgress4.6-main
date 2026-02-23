import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormGroup } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { NgSelectModule } from '@ng-select/ng-select'
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  catchError,
  tap,
} from 'rxjs'

import { PatientService } from '@core/services/api/patient.service'
import { BranchService } from '@core/services/api/branch.service'
import { FieldsConfig } from '@core/interfaces/api/clinical-form-config.interface'

import { Patient } from '@core/interfaces/api/patient.interface'

interface PatientWithFullName extends Patient {
  fullName: string
  age?: number
}

@Component({
  selector: 'app-clinical-history-step1',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule],
  templateUrl: './clinical-history-step1.component.html',
  styleUrls: ['./clinical-history-step1.component.scss'],
})
export class ClinicalHistoryStep1Component implements OnInit, OnDestroy {
  @Input() formGroup!: FormGroup
  @Input() fieldsConfig: FieldsConfig | null = null
  @Input() preSelectedPatientId?: string

  private destroy$ = new Subject<void>()
  public patientSearch$ = new Subject<string>()

  private _patientService = inject(PatientService)
  private _branchService = inject(BranchService)

  public patients: PatientWithFullName[] = []
  public selectedPatient: PatientWithFullName | null = null
  public currentBranchId: string | null = null

  public patientsLoading = false
  public showPatientSelector = true

  ngOnInit(): void {
    this.showPatientSelector = !this.preSelectedPatientId
    this.setupPatientSearch()
    this.getCurrentBranch()
    this.setupFirstTimeLogic()
    if (this.preSelectedPatientId) {
      this.loadPreSelectedPatient()
    }
  }

  shouldShowSection(sectionKey: string): boolean {
    if (!this.fieldsConfig) {
      return true
    }
    const section = this.fieldsConfig.sections[sectionKey]
    const visible = section ? section.visible : true

    return visible
  }

  shouldShowField(fieldName: string): boolean {
    if (!this.fieldsConfig) return true
    const section = this.fieldsConfig.sections['step1_personalData']
    if (!section || !section.visible) return false
    return section.fields[fieldName] ?? true
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private setupFirstTimeLogic(): void {
    const firstTimeControl = this.formGroup.get('firstTime')
    const lastVisualExamDateControl = this.formGroup.get('lastVisualExamDate')

    if (firstTimeControl && lastVisualExamDateControl) {
      firstTimeControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((isFirstTime: boolean) => {
          if (isFirstTime) {
            lastVisualExamDateControl.setValue('')
            lastVisualExamDateControl.disable()
          } else {
            lastVisualExamDateControl.enable()
          }
        })
    }
  }

  private setupPatientSearch(): void {
    this.patientSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term: string) => {
          if (!term || term.length < 2) {
            return of([])
          }

          this.patientsLoading = true
          return this._patientService
            .getPatientsByBranch(this.currentBranchId || undefined, term)
            .pipe(
              catchError((error) => {
                return of([])
              }),
              tap(() => (this.patientsLoading = false))
            )
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((patients: Patient[]) => {
        this.patients = patients.map((patient) => this.enhancePatientData(patient))
        this.patientsLoading = false
      })
  }

  private enhancePatientData(patient: Patient): PatientWithFullName {
    const fullName = `${patient.firstName} ${patient.lastName}`
    let age: number | undefined = undefined

    if (patient.dateOfBirth) {
      const birthDate = new Date(patient.dateOfBirth)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--
      }
    }

    return {
      ...patient,
      fullName,
      age,
    }
  }

  private getCurrentBranch(): void {
    this._branchService
      .getBranchFilterState()
      .pipe(takeUntil(this.destroy$))
      .subscribe((branchState: any) => {
        this.currentBranchId = branchState.selectedBranchId || null
        this.loadInitialPatients()
      })
  }

  private loadInitialPatients(): void {
    this.patientsLoading = true
    this._patientService
      .getPatientsByBranch(this.currentBranchId || undefined)
      .pipe(
        takeUntil(this.destroy$),
        tap(() => (this.patientsLoading = false))
      )
      .subscribe({
        next: (patients: Patient[]) => {
          this.patients = patients.map((patient) => this.enhancePatientData(patient))
        },
        error: (error) => {
          this.patientsLoading = false
        },
      })
  }

  private loadPreSelectedPatient(): void {
    if (!this.preSelectedPatientId) return
    this.patientsLoading = true
    this._patientService
      .getPatientById(this.preSelectedPatientId)
      .pipe(
        takeUntil(this.destroy$),
        tap(() => (this.patientsLoading = false))
      )
      .subscribe({
        next: (response) => {
          const enhancedPatient = this.enhancePatientData(response.data)
          this.selectedPatient = enhancedPatient
          this.formGroup.patchValue({ patientId: this.selectedPatient.id })
        },
        error: (error) => {
          this.patientsLoading = false
        },
      })
  }

  public onPatientSearch(term: string): void {
    this.patientSearch$.next(term)
  }

  public onPatientSelect(patient: PatientWithFullName | string): void {
    if (typeof patient === 'string') {
      const foundPatient = this.patients.find((p) => p.id === patient)
      if (foundPatient) {
        this.selectedPatient = foundPatient
      }
    } else {
      this.selectedPatient = patient
    }

    if (this.selectedPatient) {
      this.formGroup.patchValue({ patientId: this.selectedPatient.id })
    }
  }

  public onPatientClear(): void {
    this.selectedPatient = null
    this.formGroup.patchValue({ patientId: '' })
  }
}
