import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Shift } from '../../../../../core/interfaces/api/shift.interface'
import { environment } from '../../../../../../environments/environment'
import { formatAppointmentDateTime } from '@core/helpers/date-time/appointment-date-time.helper'

@Component({
  selector: 'app-view-shift-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './view-shift-modal.component.html',
  styleUrls: ['./view-shift-modal.component.scss'],
})
export class ViewShiftModalComponent {
  @Input() selectedShift!: Shift
  fileBaseUrl = environment.fileBaseUrl

  constructor(public activeModal: NgbActiveModal) {}

  getPatientFullName(): string {
    if (!this.selectedShift?.patient) return ''
    return `${this.selectedShift.patient.lastName} ${this.selectedShift.patient.firstName}`
  }

  getFormattedAppointmentDate(): string {
    if (!this.selectedShift) return ''
    return formatAppointmentDateTime(this.selectedShift.appointmentDate)
  }

  getFormattedDate(date: string | Date | undefined): string {
    if (!date) return 'N/A'
    return formatAppointmentDateTime(date)
  }

  getPatientProfileImage(): string {
    if (!this.selectedShift?.patient?.profilePhoto)
      return 'assets/images/default-avatar.png'
    return this.formatUrl(this.selectedShift.patient.profilePhoto)
  }

  private formatUrl(url?: string): string {
    if (!url) return 'assets/images/default-avatar.png'
    let cleanUrl = url.replace('/uploads/uploads/', '/uploads/')
    if (cleanUrl.startsWith('/'))
      return (
        this.fileBaseUrl + cleanUrl.replace(/ /g, '%20').replace(/\\/g, '/')
      )
    return (
      this.fileBaseUrl + '/' + cleanUrl.replace(/ /g, '%20').replace(/\\/g, '/')
    )
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement
    if (target && target.src.indexOf('avatar-1.jpg') === -1)
      target.src = 'assets/images/users/avatar-1.jpg'
  }

  closeModal(): void {
    this.activeModal.dismiss()
  }
}
