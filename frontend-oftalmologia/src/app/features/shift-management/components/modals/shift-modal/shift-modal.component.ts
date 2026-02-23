import { Component, OnInit, OnDestroy, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { NgSelectModule } from '@ng-select/ng-select'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
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
import { ShiftsService } from '../../../../../core/services/api/shifts.service'
import { ShiftStatusService } from '../../../../../core/services/api/shift-status.service'
import { PatientService } from '../../../../../core/services/api/patient.service'
import { BranchService } from '../../../../../core/services/api/branch.service'
import { Patient } from '../../../../../core/interfaces/api/patient.interface'
import {
  Shift,
  ShiftStatus,
  CreateShiftDto,
  UpdateShiftDto,
} from '../../../../../core/interfaces/api/shift.interface'
import { ShiftValidators } from '../../../validators/shift.validators'
import { environment } from '../../../../../../environments/environment'

interface PatientWithFullName extends Patient {
  fullName: string
}

@Component({
  selector: 'app-shift-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule],
  templateUrl: './shift-modal.component.html',
  styleUrls: ['./shift-modal.component.scss'],
})
export class ShiftModalComponent implements OnInit, OnDestroy {
  @Input() editMode = false
  @Input() selectedShift: Shift | null = null

  private destroy$ = new Subject<void>()
  private patientSearch$ = new Subject<string>()

  shiftForm!: FormGroup
  patients: PatientWithFullName[] = []
  statuses: ShiftStatus[] = []
  selectedPatient: PatientWithFullName | null = null
  currentBranchId: string | null = null

  patientsLoading = false
  statusesLoading = false
  formLoading = false
  fileBaseUrl = environment.fileBaseUrl

  constructor(
    private formBuilder: FormBuilder,
    private activeModal: NgbActiveModal,
    private shiftsService: ShiftsService,
    private shiftStatusService: ShiftStatusService,
    private patientService: PatientService,
    private branchService: BranchService
  ) {
    this.initializeForm()
    this.setupPatientSearch()
  }

  ngOnInit(): void {
    this.getCurrentBranch()
    this.loadStatuses()

    if (this.editMode && this.selectedShift) {
      this.populateForm()
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeForm(): void {
    this.shiftForm = this.formBuilder.group({
      patientId: [{ value: '', disabled: false }, Validators.required],
      appointmentDate: [
        '',
        [
          Validators.required,
          ShiftValidators.futureDateValidator,
          ShiftValidators.appointmentTimeValidator,
        ],
      ],
      description: ['', [ShiftValidators.maxDescriptionLength(500)]],
      statusId: [''],
    })
  }

  private setupPatientSearch(): void {
    this.patientSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || term.length < 2) {
            return of([])
          }

          this.patientsLoading = true
          return this.patientService
            .getPatientsByBranch(this.currentBranchId || undefined, term)
            .pipe(
              catchError(() => of([])),
              tap(() => (this.patientsLoading = false))
            )
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((patients) => {
        this.patients = patients.map((patient) => ({
          ...patient,
          fullName: `${patient.firstName} ${patient.lastName}`,
        }))
        this.patientsLoading = false
      })
  }

  private getCurrentBranch(): void {
    this.branchService
      .getBranchFilterState()
      .pipe(takeUntil(this.destroy$))
      .subscribe((branchState: any) => {
        this.currentBranchId = branchState.selectedBranchId || null
        this.loadInitialPatients()
      })
  }

  private loadInitialPatients(): void {
    this.patientsLoading = true
    this.patientService
      .getPatientsByBranch(this.currentBranchId || undefined)
      .pipe(
        takeUntil(this.destroy$),
        tap(() => (this.patientsLoading = false))
      )
      .subscribe((patients) => {
        this.patients = patients.map((patient) => ({
          ...patient,
          fullName: `${patient.firstName} ${patient.lastName}`,
        }))
        this.patientsLoading = false
      })
  }

  private loadStatuses(): void {
    if (!this.editMode) return

    this.statusesLoading = true
    this.shiftStatusService
      .findAllStatuses()
      .pipe(
        takeUntil(this.destroy$),
        tap(() => (this.statusesLoading = false))
      )
      .subscribe({
        next: (response: any) => {
          // Check if response.data has result property or is already an array
          this.statuses = Array.isArray(response.data)
            ? response.data
            : response.data?.result || []
          this.statusesLoading = false
        },
        error: () => {
          this.statusesLoading = false
        },
      })
  }

  private populateForm(): void {
    if (!this.selectedShift) return

    this.selectedPatient = {
      ...this.selectedShift.patient,
      fullName: `${this.selectedShift.patient.firstName} ${this.selectedShift.patient.lastName}`,
    }

    // Agregar el paciente seleccionado al array de pacientes para el ng-select
    if (
      this.selectedPatient &&
      !this.patients.find((p) => p.id === this.selectedPatient?.id)
    ) {
      this.patients = [this.selectedPatient, ...this.patients]
    }

    const appointmentDate = new Date(this.selectedShift.appointmentDate)
    const formattedDate = this.formatDateForInput(appointmentDate)

    this.shiftForm.patchValue({
      patientId: this.selectedShift.patientId,
      appointmentDate: formattedDate,
      description: this.selectedShift.description,
      statusId: this.selectedShift.statusId,
    })

    this.shiftForm.get('patientId')?.disable()
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  onPatientSelected(patientId: string): void {
    this.selectedPatient = this.patients.find((patient) => patient.id === patientId) || null
  }

  onPatientCleared(): void {
    this.selectedPatient = null
  }

  onPatientSearch(term: { term: string }): void {
    this.patientSearch$.next(term.term)
  }

  onSubmit(): void {
    if (!this.shiftForm.valid || this.formLoading) return

    this.formLoading = true

    const formValue = { ...this.shiftForm.getRawValue() }

    if (this.editMode && this.selectedShift) {
      this.updateShift(formValue)
    } else {
      this.createShift(formValue)
    }
  }

  private createShift(formValue: any): void {
    const createDto: CreateShiftDto = {
      patientId: formValue.patientId,
      appointmentDate: new Date(formValue.appointmentDate).toISOString(),
      description: formValue.description || '',
    }

    this.shiftsService
      .createShift(createDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.formLoading = false
          this.activeModal.close({ success: true, action: 'create' })
        },
        error: () => {
          this.formLoading = false
        },
      })
  }

  private updateShift(formValue: any): void {
    const updateDto: UpdateShiftDto = {
      appointmentDate: new Date(formValue.appointmentDate).toISOString(),
      description: formValue.description || '',
      statusId: formValue.statusId,
    }

    this.shiftsService
      .updateShift(this.selectedShift!.id, updateDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.formLoading = false
          this.activeModal.close({ success: true, action: 'update' })
        },
        error: () => {
          this.formLoading = false
        },
      })
  }

  getPatientProfileImage(patient: PatientWithFullName | null): string {
    if (!patient?.profilePhoto) {
      return 'assets/images/default-avatar.png'
    }

    return this.formatUrl(patient.profilePhoto)
  }

  private formatUrl(url?: string): string {
    if (!url) {
      return 'assets/images/users/avatar-1.jpg'
    }

    let cleanUrl = url.replace('/uploads/uploads/', '/uploads/')

    if (cleanUrl.startsWith('/')) {
      return (
        this.fileBaseUrl + cleanUrl.replace(/ /g, '%20').replace(/\\/g, '/')
      )
    }
    return (
      this.fileBaseUrl + '/' + cleanUrl.replace(/ /g, '%20').replace(/\\/g, '/')
    )
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement
    if (target && target.src.indexOf('avatar-1.jpg') === -1) {
      target.src = 'assets/images/users/avatar-1.jpg'
    }
  }

  onCancel(): void {
    this.activeModal.dismiss()
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.shiftForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  getFieldError(fieldName: string): string {
    const field = this.shiftForm.get(fieldName)
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'VALIDATION.REQUIRED'
      }
      if (field.errors['futureDate']) {
        return 'VALIDATION.FUTURE_DATE'
      }
      if (field.errors['invalidTime']) {
        return 'VALIDATION.INVALID_TIME'
      }
      if (field.errors['invalidInterval']) {
        return 'VALIDATION.INVALID_INTERVAL'
      }
      if (field.errors['maxlength']) {
        return 'VALIDATION.MAX_LENGTH'
      }
    }
    return ''
  }
}
