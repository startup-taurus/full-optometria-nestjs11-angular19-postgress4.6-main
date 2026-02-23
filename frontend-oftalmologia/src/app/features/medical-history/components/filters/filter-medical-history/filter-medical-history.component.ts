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
import { Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'filter-medical-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './filter-medical-history.component.html',
  styleUrl: './filter-medical-history.component.scss',
})
export class FilterMedicalHistoryComponent implements OnInit, OnDestroy {
  @Output() filterSubmit = new EventEmitter<FilterValue>()
  @Output() filterClear = new EventEmitter<void>()
  @Output() filterApplied = new EventEmitter<FilterValue>()
  @Output() filterCleared = new EventEmitter<void>()
  @Output() filterCountChanged = new EventEmitter<number>()

  public medicalHistoryFilterForm?: FormGroup

  private _fb = inject(FormBuilder)
  private _filterCommunicationService = inject(FilterCommunicationService)
  private _destroy$ = new Subject<void>()

  ngOnInit(): void {
    this.initForm()
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
            identification: filter.identification || '',
            firstName: filter.firstName || '',
            lastName: filter.lastName || '',
            phone: filter.phone || '',
            email: filter.email || '',
            status: filter.status || '',
            dateFrom: filter.dateFrom || '',
            dateTo: filter.dateTo || '',
          }

          this.medicalHistoryFilterForm?.patchValue(formValue)

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
    this.medicalHistoryFilterForm?.reset()
    this.filterCountChanged.emit(0)
    setTimeout(() => {
      this.filterCleared.emit()
    }, 0)
  }

  private initForm(): void {
    this.medicalHistoryFilterForm = this._fb.group({
      identification: [''],
      firstName: [''],
      lastName: [''],
      phone: [''],
      email: [''],
      status: [''],
      dateFrom: [''],
      dateTo: [''],
    })
  }

  public onSubmit(): void {
    if (this.medicalHistoryFilterForm) {
      const formValue = this.medicalHistoryFilterForm.value
      const cleanedFilter: FilterValue = {}

      if (formValue.identification?.trim()) {
        cleanedFilter['identification'] = formValue.identification.trim()
      }
      if (formValue.firstName?.trim()) {
        cleanedFilter['firstName'] = formValue.firstName.trim()
      }
      if (formValue.lastName?.trim()) {
        cleanedFilter['lastName'] = formValue.lastName.trim()
      }
      if (formValue.phone?.trim()) {
        cleanedFilter['phone'] = formValue.phone.trim()
      }
      if (formValue.email?.trim()) {
        cleanedFilter['email'] = formValue.email.trim()
      }
      if (formValue.status && formValue.status !== '') {
        cleanedFilter['status'] = formValue.status
      }
      if (formValue.dateFrom) {
        cleanedFilter['dateFrom'] = formValue.dateFrom
      }
      if (formValue.dateTo) {
        cleanedFilter['dateTo'] = formValue.dateTo
      }

      this._filterCommunicationService.changeFilter(cleanedFilter)
      this.filterApplied.emit(cleanedFilter)
      this.filterSubmit.emit(cleanedFilter)

      const filterCount = this.getFilterCount()
      this.filterCountChanged.emit(filterCount)
    }
  }

  public resetForm(): void {
    this.medicalHistoryFilterForm?.reset()
    this._filterCommunicationService.resetFilter()
    this.filterCountChanged.emit(0)
    setTimeout(() => {
      this.filterClear.emit()
      this.filterCleared.emit()
    }, 0)
  }

  public hasActiveFilters(): boolean {
    if (!this.medicalHistoryFilterForm) return false

    const formValue = this.medicalHistoryFilterForm.value
    return Object.values(formValue).some(
      (value) => value !== '' && value !== null && value !== undefined
    )
  }

  public getFilterCount(): number {
    if (!this.medicalHistoryFilterForm) return 0

    const formValue = this.medicalHistoryFilterForm.value
    return Object.entries(formValue).filter(([key, value]) => {
      return value !== null && value !== '' && value !== undefined
    }).length
  }
}
