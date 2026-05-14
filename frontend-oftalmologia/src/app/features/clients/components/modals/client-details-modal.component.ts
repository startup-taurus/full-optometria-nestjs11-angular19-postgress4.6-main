import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { Client } from '@core/interfaces/api/client.interface'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-client-details-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './client-details-modal.component.html',
  styleUrls: ['./client-details-modal.component.scss'],
})
export class ClientDetailsModalComponent {
  @Input() client!: Client

  constructor(public activeModal: NgbActiveModal) {}

  public get patientFullName(): string {
    const firstName = this.client?.patient?.firstName || ''
    const lastName = this.client?.patient?.lastName || ''
    return `${firstName} ${lastName}`.trim()
  }

  public get patientLinks(): Array<{ firstName: string; lastName: string }> {
    if (this.client?.patients?.length) {
      return this.client.patients
    }

    if (this.client?.patient) {
      return [this.client.patient]
    }

    return []
  }
}
