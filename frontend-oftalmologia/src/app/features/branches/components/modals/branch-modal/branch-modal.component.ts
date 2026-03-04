import { Component, OnInit, OnDestroy, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Subject, takeUntil } from 'rxjs'
import { BranchesService } from '../../../../../core/services/api/branches.service'
import {
  Branch,
  CreateBranchDto,
  UpdateBranchDto,
} from '../../../../../core/interfaces/api/branch.interface'
import {
  BRANCH_WEEK_DAYS,
  BranchOpeningScheduleDay,
  buildDefaultBranchSchedule,
  parseBranchSchedule,
  serializeBranchSchedule,
} from '../../../../../core/helpers/branch-schedule.helper'

@Component({
  selector: 'app-branch-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './branch-modal.component.html',
  styleUrls: ['./branch-modal.component.scss'],
})
export class BranchModalComponent implements OnInit, OnDestroy {
  @Input() editMode = false
  @Input() selectedBranch: Branch | null = null

  private destroy$ = new Subject<void>()

  branchForm!: FormGroup
  weeklyScheduleForm!: FormArray
  formLoading = false
  scheduleError = ''
  weekDays = BRANCH_WEEK_DAYS

  constructor(
    private formBuilder: FormBuilder,
    private activeModal: NgbActiveModal,
    private branchesService: BranchesService
  ) {
    this.initializeForm()
  }

  ngOnInit(): void {
    if (this.editMode && this.selectedBranch) {
      this.populateForm()
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeForm(): void {
    this.branchForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(20)]],
      address: ['', [Validators.required, Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      phone: ['', [Validators.required, Validators.maxLength(20)]],
      corporateEmail: ['', [Validators.required, Validators.email]],
    })

    this.initializeWeeklySchedule(buildDefaultBranchSchedule())
  }

  private populateForm(): void {
    if (!this.selectedBranch) return

    this.branchForm.patchValue({
      name: this.selectedBranch.name,
      code: this.selectedBranch.code,
      address: this.selectedBranch.address,
      city: this.selectedBranch.city,
      phone: this.selectedBranch.phone || '',
      corporateEmail: this.selectedBranch.corporateEmail || '',
    })

    this.initializeWeeklySchedule(
      parseBranchSchedule(this.selectedBranch.openingHours)
    )
  }

  public onSubmit(): void {
    if (this.branchForm.invalid || !this.isWeeklyScheduleValid()) {
      this.branchForm.markAllAsTouched()
      return
    }

    this.formLoading = true

    if (this.editMode && this.selectedBranch) {
      this.updateBranch()
    } else {
      this.createBranch()
    }
  }

  private createBranch(): void {
    const branchData: CreateBranchDto = {
      ...this.branchForm.value,
      openingHours: serializeBranchSchedule(this.getWeeklySchedule()),
    }

    this.branchesService
      .createBranch(branchData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.formLoading = false
          this.activeModal.close('created')
        },
        error: (error) => {
          this.formLoading = false
        },
      })
  }

  private updateBranch(): void {
    if (!this.selectedBranch) return

    const branchData: UpdateBranchDto = {
      ...this.branchForm.value,
      openingHours: serializeBranchSchedule(this.getWeeklySchedule()),
    }

    this.branchesService
      .updateBranch(this.selectedBranch.id, branchData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.formLoading = false
          this.activeModal.close('updated')
        },
        error: (error) => {
          this.formLoading = false
        },
      })
  }

  public isFieldInvalid(fieldName: string): boolean {
    const field = this.branchForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  public getFieldError(fieldName: string): string {
    const field = this.branchForm.get(fieldName)
    if (!field || !field.errors) return ''

    const errors = field.errors

    if (errors['required']) {
      return 'VALIDATION.REQUIRED'
    }
    if (errors['maxlength']) {
      return 'VALIDATION.MAX_LENGTH'
    }
    if (errors['email']) {
      return 'VALIDATION.INVALID_EMAIL'
    }

    return ''
  }

  public closeModal(): void {
    this.activeModal.dismiss()
  }

  public get scheduleControls(): FormGroup[] {
    return this.weeklyScheduleForm.controls as FormGroup[]
  }

  public onDayEnabledChange(index: number): void {
    const dayGroup = this.scheduleControls[index]
    const enabled = dayGroup.get('enabled')?.value

    if (enabled) {
      dayGroup.get('startTime')?.enable({ emitEvent: false })
      dayGroup.get('endTime')?.enable({ emitEvent: false })
    } else {
      dayGroup.get('startTime')?.disable({ emitEvent: false })
      dayGroup.get('endTime')?.disable({ emitEvent: false })
    }
  }

  private initializeWeeklySchedule(schedule: BranchOpeningScheduleDay[]): void {
    this.weeklyScheduleForm = this.formBuilder.array(
      schedule
        .slice()
        .sort((a, b) => a.day - b.day)
        .map((day) =>
          this.formBuilder.group({
            day: [day.day],
            enabled: [day.enabled],
            startTime: [{ value: day.startTime, disabled: !day.enabled }],
            endTime: [{ value: day.endTime, disabled: !day.enabled }],
          })
        )
    )
  }

  private getWeeklySchedule(): BranchOpeningScheduleDay[] {
    return this.scheduleControls.map((control) => {
      const value = control.getRawValue()
      return {
        day: Number(value.day),
        enabled: Boolean(value.enabled),
        startTime: value.startTime,
        endTime: value.endTime,
      }
    })
  }

  private isWeeklyScheduleValid(): boolean {
    this.scheduleError = ''
    const schedule = this.getWeeklySchedule()

    if (!schedule.some((item) => item.enabled)) {
      this.scheduleError = 'BRANCHES_MODULE.SCHEDULE_ERROR_ONE_DAY'
      return false
    }

    const hasInvalidRange = schedule.some(
      (item) =>
        item.enabled && this.timeToMinutes(item.startTime) >= this.timeToMinutes(item.endTime)
    )

    if (hasInvalidRange) {
      this.scheduleError = 'BRANCHES_MODULE.SCHEDULE_ERROR_TIME_RANGE'
      return false
    }

    return true
  }

  private timeToMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number)
    return hours * 60 + minutes
  }
}
