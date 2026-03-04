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

  getUsersUsed(): number {
    return this.selectedCompany?.usersCount ?? 0
  }

  getUsersLimit(): number | null {
    return this.selectedCompany?.maxUsers ?? null
  }

  getUsersLimitLabel(): string {
    const limit = this.getUsersLimit()
    return limit === null ? '∞' : String(limit)
  }

  getUsersUsagePercent(): number {
    const limit = this.getUsersLimit()
    if (!limit || limit <= 0) {
      return 0
    }

    return Math.min(100, Math.round((this.getUsersUsed() / limit) * 100))
  }

  getBranchesUsed(): number {
    return this.selectedCompany?.branchesCount ?? 0
  }

  getBranchesLimit(): number | null {
    return this.selectedCompany?.maxBranches ?? null
  }

  getBranchesLimitLabel(): string {
    const limit = this.getBranchesLimit()
    return limit === null ? '∞' : String(limit)
  }

  getBranchesUsagePercent(): number {
    const limit = this.getBranchesLimit()
    if (!limit || limit <= 0) {
      return 0
    }

    return Math.min(100, Math.round((this.getBranchesUsed() / limit) * 100))
  }

  getUsersRemainingLabel(): string {
    const limit = this.getUsersLimit()
    if (limit === null) {
      return 'Sin límite'
    }

    return `${Math.max(limit - this.getUsersUsed(), 0)} disponibles`
  }

  getBranchesRemainingLabel(): string {
    const limit = this.getBranchesLimit()
    if (limit === null) {
      return 'Sin límite'
    }

    return `${Math.max(limit - this.getBranchesUsed(), 0)} disponibles`
  }

  closeModal(): void {
    this.activeModal.dismiss()
  }
}
