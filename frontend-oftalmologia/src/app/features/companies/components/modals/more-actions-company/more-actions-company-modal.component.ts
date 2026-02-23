import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Company } from '../../../../../core/interfaces/api/company.interface'

@Component({
  selector: 'app-more-actions-company-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './more-actions-company-modal.component.html',
  styleUrls: ['./more-actions-company-modal.component.scss'],
})
export class MoreActionsCompanyModalComponent {
  @Input() selectedCompany!: Company

  constructor(public activeModal: NgbActiveModal) {}

  viewDetails(): void {
    this.activeModal.close({ action: 'view', company: this.selectedCompany })
  }

  changeStatus(): void {
    this.activeModal.close({ action: 'changeStatus', company: this.selectedCompany })
  }

  editCompany(): void {
    this.activeModal.close({ action: 'edit', company: this.selectedCompany })
  }

  deleteCompany(): void {
    this.activeModal.close({ action: 'delete', company: this.selectedCompany })
  }

  closeModal(): void {
    this.activeModal.dismiss()
  }
}
