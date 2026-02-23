import { CommonModule } from '@angular/common'
import { Component, inject, OnInit, OnDestroy } from '@angular/core'
import { Patient } from '@core/interfaces/api/patient.interface'
import { ModalWithAction } from '@core/interfaces/ui/bootstrap-modal.interface'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'
import { environment } from '@environment/environment'

@Component({
  selector: 'app-patient-details-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './patient-details-modal.component.html',
  styleUrls: ['./patient-details-modal.component.scss'],
})
export class PatientDetailsModalComponent implements OnInit, OnDestroy {
  public selectedPatient?: Patient
  public loading = true
  public patientImage: string = 'assets/images/default-avatar.png'
  private fileBaseUrl: string = environment.fileBaseUrl

  private _activeModal = inject(NgbActiveModal)
  private _bsModalService = inject(
    BootstrapModalService<ModalWithAction<Patient>>
  )
  private unsubscribe$ = new Subject<boolean>()

  ngOnInit(): void {
    this._bsModalService
      .getDataIssued()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: ModalWithAction<Patient>) => {
        this.setModalData(data)
      })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(true)
    this.unsubscribe$.complete()
  }

  public setModalData(data: ModalWithAction<Patient>): void {
    if (data.selectedRow) {
      this.selectedPatient = data.selectedRow
      this.patientImage = this.selectedPatient.profilePhoto
        ? this.formatUrl(this.selectedPatient.profilePhoto)
        : 'assets/images/default-avatar.png'
      this.loading = false
    } else {
      console.error('PatientDetailsModal - No selectedRow data provided')
      this.loading = false
    }
  }

  public onClose(): void {
    this._activeModal.dismiss('close')
  }

  public formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  public formatDateTime(date: Date | string | undefined): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  private formatUrl(url?: string): string {
    if (!url) {
      return 'assets/images/default-avatar.png'
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
}
