import { CommonModule } from '@angular/common'
import {
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
  OnDestroy,
} from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { FilterValue } from '../../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { ShiftStatusService } from '@core/services/api/shift-status.service'
import { ShiftStatus } from '@core/interfaces/api/shift.interface'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  selector: 'filter-shift-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './filter-shift-management.component.html',
  styleUrl: './filter-shift-management.component.scss',
})
export class FilterShiftManagementComponent implements OnInit, OnDestroy {
  @Output() filterApplied = new EventEmitter<FilterValue>()
  @Output() filterCleared = new EventEmitter<void>()
  @Output() filterCountChanged = new EventEmitter<number>()

  public shiftFilterForm?: FormGroup
  public statuses: ShiftStatus[] = []
  public statusesLoading = false

  private _fb = inject(FormBuilder)
  private _filterCommunicationService = inject(FilterCommunicationService)
  private _shiftStatusService = inject(ShiftStatusService)
  private _destroy$ = new Subject<void>()

  ngOnInit(): void {
    this.initForm()
    this.loadStatuses()
    this.subscribeToFilterCommunication()
  }

  ngOnDestroy(): void {
    this._destroy$.next()
    this._destroy$.complete()
  }

  private subscribeToFilterCommunication(): void {
    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this._destroy$))
      .subscribe((filter) => {
        if (filter && Object.keys(filter).length === 0) {
          this.resetFormOnly()
        } else if (filter && Object.keys(filter).length > 0) {
          const formValue: any = {
            patientName: filter.patientName || '',
            patientId: filter.patientId || '',
            phone: filter.phone || '',
            email: filter.email || '',
            statusId: filter.statusId || '',
            dateFrom: filter.dateFrom || '',
            dateTo: filter.dateTo || '',
          }
          this.shiftFilterForm?.patchValue(formValue)

          setTimeout(() => {
            const filterCount = this.getFilterCount()
            this.filterCountChanged.emit(filterCount)
          }, 0)
        } else {
          this.resetFormOnly()
        }
      })
  }

  private resetFormOnly(): void {
    this.shiftFilterForm?.reset()
    setTimeout(() => {
      this.filterCountChanged.emit(0)
    }, 0)
  }

  private initForm(): void {
    this.shiftFilterForm = this._fb.group({
      patientName: [''],
      patientId: [''],
      phone: [''],
      email: [''],
      statusId: [''],
      dateFrom: [''],
      dateTo: [''],
    })
  }

  private loadStatuses(): void {
    this.statusesLoading = true
    this._shiftStatusService
      .findAllStatuses()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response: any) => {
          this.statuses = Array.isArray(response.data)
            ? response.data
            : response.data?.result || []
          this.statusesLoading = false
        },
        error: (error) => {
          this.statusesLoading = false
        },
      })
  }

  public onSubmit(): void {
    if (this.shiftFilterForm) {
      const formValue = this.shiftFilterForm.value
      const cleanedFilter: FilterValue = {}

      Object.keys(formValue).forEach((key) => {
        if (
          formValue[key] !== '' &&
          formValue[key] !== null &&
          formValue[key] !== undefined
        ) {
          if (key === 'dateFrom' || key === 'dateTo') {
            cleanedFilter[key] = formValue[key] + 'T00:00:00.000Z'
          } else {
            cleanedFilter[key] = formValue[key]
          }
        }
      })

      this._filterCommunicationService.changeFilter(cleanedFilter)
      this.filterApplied.emit(cleanedFilter)

      const filterCount = this.getFilterCount()
      this.filterCountChanged.emit(filterCount)
    }
  }

  public onReset(): void {
    this.shiftFilterForm?.reset()
    this._filterCommunicationService.resetFilter()
    this.filterCountChanged.emit(0)

    setTimeout(() => {
      this.filterCleared.emit()
      this.filterApplied.emit({})
    }, 0)
  }

  public onClear(): void {
    this.onReset()
  }

  public hasActiveFilters(): boolean {
    if (!this.shiftFilterForm) return false

    const formValue = this.shiftFilterForm.value
    return Object.entries(formValue).some(([key, value]) => {
      return value !== '' && value !== null && value !== undefined
    })
  }

  public getFilterCount(): number {
    if (!this.shiftFilterForm) return 0

    const formValue = this.shiftFilterForm.value
    return Object.entries(formValue).filter(([key, value]) => {
      return value !== '' && value !== null && value !== undefined
    }).length
  }
}
