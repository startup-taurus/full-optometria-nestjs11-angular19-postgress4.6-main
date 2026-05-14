import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, Output, inject } from '@angular/core'
import { Client } from '@core/interfaces/api/client.interface'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { ClientModalComponent } from '../../../laboratoy-orders/components/modals/client-modal/client-modal.component'

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.scss'],
})
export class ClientFormComponent {
  @Input() mode: 'create' | 'edit' = 'create'
  @Input() client?: Client
  @Input() buttonClass = 'btn btn-primary btn-sm'
  @Input() iconClass = 'ti ti-plus'
  @Input() labelKey = 'COMMON.CREATE'

  @Output() saved = new EventEmitter<Client>()

  private _modalService = inject(NgbModal)

  public open(): void {
    const modalRef = this._modalService.open(ClientModalComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    })

    modalRef.componentInstance.mode = this.mode
    modalRef.componentInstance.client = this.client
    modalRef.componentInstance.patientId = this.client?.patientId || null
    modalRef.componentInstance.allowPatientSelection = true

    modalRef.result.then(
      (result?: Client) => {
        if (result?.id) {
          this.saved.emit(result)
        }
      },
      () => {},
    )
  }
}
