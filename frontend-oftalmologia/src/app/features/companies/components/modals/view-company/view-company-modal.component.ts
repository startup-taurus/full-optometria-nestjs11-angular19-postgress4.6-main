import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Company } from '../../../../../core/interfaces/api/company.interface'
import { environment } from '../../../../../../environments/environment'

@Component({
  selector: 'app-view-company-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './view-company-modal.component.html',
  styleUrls: ['./view-company-modal.component.scss'],
})
export class ViewCompanyModalComponent {
  @Input() selectedCompany!: Company

  constructor(public activeModal: NgbActiveModal) {}

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

  getLogoUrl(): string {
    if (this.selectedCompany?.logoFile?.path) {
      return `${environment.fileBaseUrl}/${this.selectedCompany.logoFile.path}`
    }
    return ''
  }

  closeModal(): void {
    this.activeModal.dismiss()
  }
}
