import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Branch } from '../../../../../core/interfaces/api/branch.interface'

@Component({
  selector: 'app-view-branch-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './view-branch-modal.component.html',
  styleUrls: ['./view-branch-modal.component.scss'],
})
export class ViewBranchModalComponent {
  @Input() selectedBranch!: Branch

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

  closeModal(): void {
    this.activeModal.dismiss()
  }
}
