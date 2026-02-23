import { Component, OnInit, OnDestroy, Input, ViewEncapsulation } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { NgSelectModule } from '@ng-select/ng-select'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Subject, takeUntil } from 'rxjs'
import { ShiftsService } from '../../../../../core/services/api/shifts.service'
import { ShiftStatusService } from '../../../../../core/services/api/shift-status.service'
import { Shift, ShiftStatus } from '../../../../../core/interfaces/api/shift.interface'
import { environment } from '../../../../../../environments/environment'

@Component({
  selector: 'app-change-status-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule],
  templateUrl: './change-status-modal.component.html',
  styleUrls: ['./change-status-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ChangeStatusModalComponent implements OnInit, OnDestroy {
  @Input() selectedShift!: Shift
  private destroy$ = new Subject<void>()
  statusForm!: FormGroup
  statuses: ShiftStatus[] = []
  statusesLoading = false
  formLoading = false
  fileBaseUrl = environment.fileBaseUrl

  constructor(
    private formBuilder: FormBuilder,
    private activeModal: NgbActiveModal,
    private shiftsService: ShiftsService,
    private shiftStatusService: ShiftStatusService
  ) {
    this.statusForm = this.formBuilder.group({
      statusId: ['', Validators.required]
    })
  }

  ngOnInit(): void {
    this.loadStatuses()
    this.setCurrentStatus()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private loadStatuses(): void {
    this.statusesLoading = true
    this.shiftStatusService.findAllStatuses().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.statuses = Array.isArray(response.data) ? response.data : response.data?.result || []
        this.statusesLoading = false
      },
      error: () => { this.statusesLoading = false }
    })
  }

  private setCurrentStatus(): void {
    if (this.selectedShift) {
      this.statusForm.patchValue({ statusId: this.selectedShift.statusId })
    }
  }

  getPatientFullName(): string {
    if (!this.selectedShift?.patient) return ''
    return `${this.selectedShift.patient.firstName} ${this.selectedShift.patient.lastName}`
  }

  getFormattedAppointmentDate(): string {
    if (!this.selectedShift) return ''
    const date = new Date(this.selectedShift.appointmentDate)
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  getCurrentStatusName(): string {
    if (!this.selectedShift?.status) return ''
    return this.selectedShift.status.name
  }

  getCurrentStatusColor(): string {
    if (!this.selectedShift?.status) return '#6c757d'
    return this.selectedShift.status.color
  }

  getPatientProfileImage(): string {
    if (!this.selectedShift?.patient?.profilePhoto) return 'assets/images/users/avatar-1.jpg'
    return this.formatUrl(this.selectedShift.patient.profilePhoto)
  }

  private formatUrl(url?: string): string {
    if (!url) return 'assets/images/users/avatar-1.jpg'
    let cleanUrl = url.replace('/uploads/uploads/', '/uploads/')
    if (cleanUrl.startsWith('/')) return this.fileBaseUrl + cleanUrl.replace(/ /g, '%20').replace(/\\/g, '/')
    return this.fileBaseUrl + '/' + cleanUrl.replace(/ /g, '%20').replace(/\\/g, '/')
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement
    if (target && target.src.indexOf('avatar-1.jpg') === -1) target.src = 'assets/images/users/avatar-1.jpg'
  }

  onSubmit(): void {
    if (!this.statusForm.valid || this.formLoading) return
    const newStatusId = this.statusForm.get('statusId')?.value
    if (newStatusId === this.selectedShift.statusId) {
      this.activeModal.dismiss('no-change')
      return
    }
    this.formLoading = true
    this.shiftsService.updateShift(this.selectedShift.id, { statusId: newStatusId }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.formLoading = false
        this.activeModal.close({ success: true, action: 'status-change', newStatusId })
      },
      error: () => { this.formLoading = false }
    })
  }

  onCancel(): void { this.activeModal.dismiss() }
}
