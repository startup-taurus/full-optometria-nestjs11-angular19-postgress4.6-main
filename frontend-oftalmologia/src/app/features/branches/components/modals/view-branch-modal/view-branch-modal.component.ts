import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Branch } from '../../../../../core/interfaces/api/branch.interface'
import {
  formatBranchScheduleByDayForDisplay,
  formatBranchScheduleForDisplay,
} from '../../../../../core/helpers/branch-schedule.helper'

@Component({
  selector: 'app-view-branch-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './view-branch-modal.component.html',
  styleUrls: ['./view-branch-modal.component.scss'],
})
export class ViewBranchModalComponent {
  @Input() selectedBranch!: Branch

  constructor(
    public activeModal: NgbActiveModal,
    private translateService: TranslateService
  ) {}

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

  getFormattedOpeningHours(): string {
    return formatBranchScheduleForDisplay(this.selectedBranch?.openingHours, {
      dayLabelResolver: (day) => this.getDayLabel(day),
      closedLabel: this.translateService.instant('WORDS.CLOSED'),
    })
  }

  getDetailedOpeningHours(): string[] {
    return formatBranchScheduleByDayForDisplay(this.selectedBranch?.openingHours, {
      dayLabelResolver: (day) => this.getDayLabel(day),
      closedLabel: this.translateService.instant('WORDS.CLOSED'),
    })
  }

  private getDayLabel(day: number): string {
    const weekDay = [
      'WORDS.SUNDAY',
      'WORDS.MONDAY',
      'WORDS.TUESDAY',
      'WORDS.WEDNESDAY',
      'WORDS.THURSDAY',
      'WORDS.FRIDAY',
      'WORDS.SATURDAY',
    ][day]

    return this.translateService.instant(weekDay)
  }

  closeModal(): void {
    this.activeModal.dismiss()
  }
}
