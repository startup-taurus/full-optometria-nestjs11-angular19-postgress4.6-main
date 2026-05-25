import { Component, OnInit, OnDestroy, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { TranslateService } from '@ngx-translate/core'
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
import { Branch } from '../../../../../core/interfaces/api/branch.interface'
import {
  Shift,
  ShiftStatus,
  CreateShiftDto,
  UpdateShiftDto,
} from '../../../../../core/interfaces/api/shift.interface'
import { ShiftValidators } from '../../../validators/shift.validators'
import { environment } from '../../../../../../environments/environment'
import {
  BranchOpeningScheduleDay,
  BRANCH_WEEK_DAYS,
  buildDefaultBranchSchedule,
  parseBranchSchedule,
} from '../../../../../core/helpers/branch-schedule.helper'
import {
  localDateTimeToIso,
  toDateTimeLocalValue,
} from '../../../../../core/helpers/date-time/appointment-date-time.helper'

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
  @Input() preSelectedPatientId?: string

  private destroy$ = new Subject<void>()
  private patientSearch$ = new Subject<string>()

  shiftForm!: FormGroup
  patients: PatientWithFullName[] = []
  statuses: ShiftStatus[] = []
  selectedPatient: PatientWithFullName | null = null
  currentBranchId: string | null = null
  branchSchedule: BranchOpeningScheduleDay[] = buildDefaultBranchSchedule()

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
    private branchService: BranchService,
    private translateService: TranslateService
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
          ShiftValidators.appointmentTimeValidator(this.branchSchedule),
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
          fullName: `${patient.lastName} ${patient.firstName}`,
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
        this.loadBranchSchedule(this.currentBranchId, branchState.selectedBranch)
        this.loadInitialPatients()
      })
  }

  private loadBranchSchedule(
    branchId: string | null,
    selectedBranch?: Branch | null
  ): void {
    if (selectedBranch?.openingHours) {
      this.branchSchedule = parseBranchSchedule(selectedBranch.openingHours)
      this.applyAppointmentValidators()
      return
    }

    if (!branchId) {
      this.branchSchedule = buildDefaultBranchSchedule()
      this.applyAppointmentValidators()
      return
    }

    this.branchService
      .getBranchById(branchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((branch) => {
        this.branchSchedule = parseBranchSchedule(branch?.openingHours)
        this.applyAppointmentValidators()
      })
  }

  private applyAppointmentValidators(): void {
    const appointmentControl = this.shiftForm.get('appointmentDate')
    if (!appointmentControl) {
      return
    }

    appointmentControl.setValidators([
      Validators.required,
      ShiftValidators.futureDateValidator,
      ShiftValidators.appointmentTimeValidator(this.branchSchedule),
    ])

    appointmentControl.updateValueAndValidity({ emitEvent: false })
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
          fullName: `${patient.lastName} ${patient.firstName}`,
        }))
        this.applyPreSelectedPatient()
        this.patientsLoading = false
      })
  }

  private applyPreSelectedPatient(): void {
    if (this.editMode || !this.preSelectedPatientId) {
      return
    }

    const selected =
      this.patients.find((patient) => patient.id === this.preSelectedPatientId) ||
      null

    if (selected) {
      this.selectedPatient = selected
      this.shiftForm.patchValue({ patientId: selected.id })
      return
    }

    this.patientService
      .getPatientById(this.preSelectedPatientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const patient = response.data
          if (!patient?.id) {
            return
          }

          const mappedPatient: PatientWithFullName = {
            ...patient,
            fullName: `${patient.lastName} ${patient.firstName}`,
          }

          this.patients = [
            mappedPatient,
            ...this.patients.filter((item) => item.id !== mappedPatient.id),
          ]
          this.selectedPatient = mappedPatient
          this.shiftForm.patchValue({ patientId: mappedPatient.id })
        },
        error: () => {},
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
      fullName: `${this.selectedShift.patient.lastName} ${this.selectedShift.patient.firstName}`,
    }

    // Agregar el paciente seleccionado al array de pacientes para el ng-select
    if (
      this.selectedPatient &&
      !this.patients.find((p) => p.id === this.selectedPatient?.id)
    ) {
      this.patients = [this.selectedPatient, ...this.patients]
    }

    const formattedDate = toDateTimeLocalValue(this.selectedShift.appointmentDate)

    this.shiftForm.patchValue({
      patientId: this.selectedShift.patientId,
      appointmentDate: formattedDate,
      description: this.selectedShift.description,
      statusId: this.selectedShift.statusId,
    })

    this.shiftForm.get('patientId')?.disable()
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
    const normalizedDescription = formValue.description?.trim() || undefined

    const createDto: CreateShiftDto = {
      patientId: formValue.patientId,
      appointmentDate: localDateTimeToIso(formValue.appointmentDate),
      description: normalizedDescription,
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
    const normalizedDescription = formValue.description?.trim() || ''

    const updateDto: UpdateShiftDto = {
      appointmentDate: localDateTimeToIso(formValue.appointmentDate),
      description: normalizedDescription,
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

  getAppointmentDateError(): string {
    const field = this.shiftForm.get('appointmentDate')
    if (!field || !field.errors || !(field.dirty || field.touched)) {
      return ''
    }

    if (field.errors['required']) {
      return this.translateService.instant('VALIDATION.REQUIRED')
    }

    if (field.errors['futureDate']) {
      return this.translateService.instant('VALIDATION.FUTURE_DATE')
    }

    if (field.errors['invalidTime']) {
      const daySchedule = this.getSelectedDaySchedule(field.value)
      if (!daySchedule) {
        return this.translateService.instant('VALIDATION.INVALID_TIME')
      }

      const dayLabel = this.getDayLabel(daySchedule.day)

      if (!daySchedule.enabled) {
        return this.translateService.instant('VALIDATION.INVALID_TIME_CLOSED_DAY', {
          day: dayLabel,
        })
      }

      return this.translateService.instant('VALIDATION.INVALID_TIME_BRANCH_SCHEDULE', {
        day: dayLabel,
        startTime: this.to12Hour(daySchedule.startTime),
        endTime: this.to12Hour(daySchedule.endTime),
      })
    }

    return ''
  }

  private getSelectedDaySchedule(rawDate: string): BranchOpeningScheduleDay | null {
    if (!rawDate) {
      return null
    }

    const selectedDate = new Date(rawDate)
    if (Number.isNaN(selectedDate.getTime())) {
      return null
    }

    return this.branchSchedule.find((item) => item.day === selectedDate.getDay()) || null
  }

  private getDayLabel(day: number): string {
    const date = new Date(2024, 0, day + 7)
    const locale = (this.translateService.currentLang || 'es').toLowerCase().startsWith('en')
      ? 'en-US'
      : 'es-ES'

    try {
      return date.toLocaleDateString(locale, { weekday: 'long' })
    } catch {
      const dayKey = BRANCH_WEEK_DAYS.find((item) => item.day === day)?.labelKey ?? ''
      return this.translateService.instant(dayKey)
    }
  }

  private to12Hour(time: string): string {
    const [hours, minutes] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)

    const locale = (this.translateService.currentLang || 'es').toLowerCase().startsWith('en')
      ? 'en-US'
      : 'es-ES'

    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }
}
