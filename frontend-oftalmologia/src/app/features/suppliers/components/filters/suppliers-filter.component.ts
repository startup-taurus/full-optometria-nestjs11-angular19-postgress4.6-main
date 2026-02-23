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
import { FilterValue } from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'suppliers-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './suppliers-filter.component.html',
  styleUrl: './suppliers-filter.component.scss',
})
export class SuppliersFilterComponent implements OnInit, OnDestroy {
  @Output() filterApplied = new EventEmitter<FilterValue>()
  @Output() filterCleared = new EventEmitter<void>()
  @Output() filterCountChanged = new EventEmitter<number>()

  public suppliersFilterForm?: FormGroup

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
            name: filter.name || '',
            documentNumber: filter.documentNumber || '',
            email: filter.email || '',
            phone: filter.phone || '',
            isActive:
              filter.isActive !== undefined
                ? filter.isActive
                  ? 'true'
                  : 'false'
                : '',
          }

          this.suppliersFilterForm?.patchValue(formValue)

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
    this.suppliersFilterForm?.reset()
    this.filterCountChanged.emit(0)
    setTimeout(() => {
      this.filterCleared.emit()
    }, 0)
  }

  private initForm(): void {
    this.suppliersFilterForm = this._fb.group({
      name: [''],
      documentNumber: [''],
      email: [''],
      phone: [''],
      isActive: [''],
    })
  }

  public onSubmit(): void {
    if (this.suppliersFilterForm) {
      const formValue = this.suppliersFilterForm.value
      const cleanedFilter: FilterValue = {}

      if (formValue.name?.trim()) {
        cleanedFilter['name'] = formValue.name.trim()
      }

      if (formValue.documentNumber?.trim()) {
        cleanedFilter['documentNumber'] = formValue.documentNumber.trim()
      }

      if (formValue.email?.trim()) {
        cleanedFilter['email'] = formValue.email.trim()
      }

      if (formValue.phone?.trim()) {
        cleanedFilter['phone'] = formValue.phone.trim()
      }

      if (formValue.isActive && formValue.isActive !== '') {
        cleanedFilter['isActive'] = formValue.isActive === 'true'
      }

      this._filterCommunicationService.changeFilter(cleanedFilter)
      this.filterApplied.emit(cleanedFilter)

      const filterCount = this.getFilterCount()
      this.filterCountChanged.emit(filterCount)
    }
  }

  public resetForm(): void {
    this.suppliersFilterForm?.reset()
    this._filterCommunicationService.resetFilter()
    this.filterCountChanged.emit(0)
    setTimeout(() => {
      this.filterCleared.emit()
    }, 0)
  }

  public hasActiveFilters(): boolean {
    if (!this.suppliersFilterForm) return false

    const formValue = this.suppliersFilterForm.value
    return Object.values(formValue).some(
      (value) => value !== '' && value !== null && value !== undefined
    )
  }

  public getFilterCount(): number {
    if (!this.suppliersFilterForm) return 0

    const formValue = this.suppliersFilterForm.value
    return Object.entries(formValue).filter(([key, value]) => {
      if (key === 'isActive') {
        return value !== null && value !== undefined && value !== ''
      }
      return value !== null && value !== '' && value !== undefined
    }).length
  }
}
