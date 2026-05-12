import { CommonModule } from '@angular/common'
import { Component, inject, OnInit, OnDestroy } from '@angular/core'
import { Patient } from '@core/interfaces/api/patient.interface'
import { Client } from '@core/interfaces/api/client.interface'
import { ModalWithAction } from '@core/interfaces/ui/bootstrap-modal.interface'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { ClientsService } from '@core/services/api/clients.service'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'
import { environment } from '@environment/environment'
import { ClientModalComponent } from '../../../laboratoy-orders/components/modals/client-modal/client-modal.component'

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
  public clients: Client[] = []
  public clientsLoading = false
  private fileBaseUrl: string = environment.fileBaseUrl
  private hasClientChanges = false

  private _activeModal = inject(NgbActiveModal)
  private _modalService = inject(NgbModal)
  private _clientsService = inject(ClientsService)
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
      this.hasClientChanges = false
      this.loadClients()
      this.loading = false
    } else {
      console.error('PatientDetailsModal - No selectedRow data provided')
      this.loading = false
    }
  }

  private loadClients(recentlyCreatedClient?: Client): void {
    if (!this.selectedPatient?.id) return

    this.clientsLoading = true
    this._clientsService
      .getAll(this.selectedPatient.id, { page: 1, limit: 50 })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (result) => {
          const fetchedClients = result.data || []
          this.clients = recentlyCreatedClient?.id
            ? this.mergeClients(recentlyCreatedClient, fetchedClients)
            : fetchedClients
          this.clientsLoading = false
        },
        error: () => {
          this.clients = []
          this.clientsLoading = false
        },
      })
  }

  private mergeClients(createdClient: Client, fetchedClients: Client[]): Client[] {
    return [
      createdClient,
      ...fetchedClients.filter((client) => client.id !== createdClient.id),
    ]
  }

  public openCreateClientModal(): void {
    if (!this.selectedPatient?.id) {
      return
    }

    const modalRef = this._modalService.open(ClientModalComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    })

    modalRef.componentInstance.mode = 'create'
    modalRef.componentInstance.patientId = this.selectedPatient.id

    modalRef.result.then(
      (createdClient?: Client) => {
        if (createdClient?.id) {
          this.hasClientChanges = true
          this.clients = [
            createdClient,
            ...this.clients.filter((client) => client.id !== createdClient.id),
          ]
          this.loadClients(createdClient)
          return
        }
        this.loadClients()
      },
      () => {}
    )
  }

  public openEditClientModal(client: Client): void {
    if (!this.selectedPatient?.id || !client?.id) {
      return
    }

    const modalRef = this._modalService.open(ClientModalComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    })

    modalRef.componentInstance.mode = 'edit'
    modalRef.componentInstance.patientId = this.selectedPatient.id
    modalRef.componentInstance.client = client

    modalRef.result.then(
      (updatedClient?: Client) => {
        if (updatedClient?.id) {
          this.hasClientChanges = true
          this.clients = this.mergeClients(updatedClient, this.clients)
          this.loadClients(updatedClient)
          return
        }
        this.loadClients()
      },
      () => {}
    )
  }

  public onClose(): void {
    if (this.hasClientChanges) {
      this._activeModal.close('updated')
      return
    }

    this._activeModal.dismiss('close')
  }

  public formatDate(date: Date | string | undefined | null): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  public formatBirthDisplay(patient?: Patient): string {
    if (!patient) return 'N/A'
    if (patient.dateOfBirth) {
      return this.formatDate(patient.dateOfBirth)
    }
    if (patient.birthYear) {
      return String(patient.birthYear)
    }
    return 'N/A'
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
