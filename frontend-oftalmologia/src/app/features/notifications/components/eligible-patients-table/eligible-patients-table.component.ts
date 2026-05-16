import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  computed,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { RenewalEligiblePatient } from '@core/interfaces/api/notifications.interface'
import { NgxDatatableComponent } from '../../../../shared/components/tables/ngx-datatabale/ngx-datatable.component'
import { NgxDatatableConfig } from '@core/interfaces/ui/ngx-datatable.interface'
import { DEFAULT_NGX_DATATABLE_PAGINATION } from '@core/helpers/ui/ngx-datatable.constant'

@Component({
  selector: 'app-eligible-patients-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NgxDatatableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './eligible-patients-table.component.html',
  styleUrl: './eligible-patients-table.component.scss',
})
export class EligiblePatientsTableComponent {
  @Input() set patients(value: RenewalEligiblePatient[] | null) {
    this._patients.set(value || [])
  }

  @Input() loading = false
  @Input() searchValue = ''
  @Output() searchChange = new EventEmitter<string>()
  @Output() refresh = new EventEmitter<void>()
  @Output() selectionChange = new EventEmitter<string[]>()

  @ViewChild('checkboxTpl', { static: true })
  checkboxTpl!: TemplateRef<any>
  @ViewChild('patientTpl', { static: true })
  patientTpl!: TemplateRef<any>
  @ViewChild('daysTpl', { static: true })
  daysTpl!: TemplateRef<any>
  @ViewChild('dueSoonTpl', { static: true })
  dueSoonTpl!: TemplateRef<any>

  readonly _patients = signal<RenewalEligiblePatient[]>([])
  readonly selectedIds = signal<Set<string>>(new Set())

  readonly tableConfig = computed<Partial<NgxDatatableConfig>>(() => ({
    limit: DEFAULT_NGX_DATATABLE_PAGINATION.LIMIT,
    page: DEFAULT_NGX_DATATABLE_PAGINATION.PAGE,
    count: this._patients().length,
    loadingIndicator: this.loading,
    columns: [
      {
        name: '',
        prop: 'select',
        width: 40,
        sortable: false,
        cellTemplate: this.checkboxTpl,
        isPrimary: true,
      },
      {
        name: 'NOTIFICATIONS.ELIGIBLE.PATIENT',
        prop: 'firstName',
        width: 200,
        cellTemplate: this.patientTpl,
        sortable: true,
        isPrimary: true,
      },
      {
        name: 'NOTIFICATIONS.ELIGIBLE.DOCUMENT',
        prop: 'documentNumber',
        width: 130,
      },
      {
        name: 'NOTIFICATIONS.ELIGIBLE.PHONE',
        prop: 'phone',
        width: 150,
      },
      {
        name: 'NOTIFICATIONS.ELIGIBLE.DAYS',
        prop: 'daysUntilRenewal',
        width: 100,
        cellTemplate: this.daysTpl,
        sortable: true,
      },
      {
        name: 'NOTIFICATIONS.ELIGIBLE.DUE_SOON',
        prop: 'isDueSoon',
        width: 110,
        cellTemplate: this.dueSoonTpl,
      },
    ],
  }))

  isSelected(id: string): boolean {
    return this.selectedIds().has(id)
  }

  toggleOne(id: string, checked: boolean): void {
    const current = new Set(this.selectedIds())
    if (checked) current.add(id)
    else current.delete(id)
    this.selectedIds.set(current)
    this.selectionChange.emit(Array.from(current))
  }

  toggleAll(checked: boolean): void {
    const next = new Set<string>()
    if (checked) {
      for (const p of this._patients()) {
        next.add(p.patientId)
      }
    }
    this.selectedIds.set(next)
    this.selectionChange.emit(Array.from(next))
  }

  isAllSelected(): boolean {
    const list = this._patients()
    return list.length > 0 && list.every((p) => this.selectedIds().has(p.patientId))
  }

  onSearch(value: string): void {
    this.searchChange.emit(value)
  }

  onRefresh(): void {
    this.refresh.emit()
  }

  clearSelection(): void {
    this.selectedIds.set(new Set())
    this.selectionChange.emit([])
  }
}
