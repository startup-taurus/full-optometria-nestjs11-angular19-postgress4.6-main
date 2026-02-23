import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Shift } from '../../../../../core/interfaces/api/shift.interface'
import { environment } from '../../../../../../environments/environment'

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
    return `${this.selectedShift.patient.firstName} ${this.selectedShift.patient.lastName}`
  }

  getFormattedAppointmentDate(): string {
    if (!this.selectedShift) return ''
    const date = new Date(this.selectedShift.appointmentDate)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  getFormattedDate(date: string | Date | undefined): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
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
