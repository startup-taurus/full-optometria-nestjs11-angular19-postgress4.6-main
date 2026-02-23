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
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  selector: 'filter-branches',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './filter-branches.component.html',
  styleUrls: ['./filter-branches.component.scss'],
})
export class FilterBranchesComponent implements OnInit, OnDestroy {
  @Output() filterApplied = new EventEmitter<FilterValue>()
  @Output() filterCleared = new EventEmitter<void>()
  @Output() filterCountChanged = new EventEmitter<number>()

  public branchesFilterForm?: FormGroup

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
            code: filter.code || '',
            city: filter.city || '',
            phone: filter.phone || '',
            corporateEmail: filter.corporateEmail || '',
            address: filter.address || '',
            isActive: filter.isActive !== undefined ? filter.isActive : '',
          }
          this.branchesFilterForm?.patchValue(formValue)

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
    this.branchesFilterForm?.reset()
    setTimeout(() => {
      this.filterCountChanged.emit(0)
    }, 0)
  }

  private initForm(): void {
    this.branchesFilterForm = this._fb.group({
      name: [''],
      code: [''],
      city: [''],
      phone: [''],
      corporateEmail: [''],
      address: [''],
      isActive: [''],
    })
  }

  public onSubmit(): void {
    if (this.branchesFilterForm) {
      const formValue = this.branchesFilterForm.value
      const cleanedFilter: FilterValue = {}

      Object.keys(formValue).forEach((key) => {
        if (
          formValue[key] !== '' &&
          formValue[key] !== null &&
          formValue[key] !== undefined
        ) {
          if (key === 'isActive') {
            cleanedFilter[key] =
              formValue[key] === 'true' || formValue[key] === true
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
    this.branchesFilterForm?.reset()
    this._filterCommunicationService.resetFilter()
    this.filterCountChanged.emit(0)

    setTimeout(() => {
      this.filterCleared.emit()
      this.filterApplied.emit({})
    }, 0)
  }

  private getFilterCount(): number {
    if (!this.branchesFilterForm) return 0

    const formValue = this.branchesFilterForm.value
    let count = 0

    Object.keys(formValue).forEach((key) => {
      if (
        formValue[key] !== '' &&
        formValue[key] !== null &&
        formValue[key] !== undefined
      ) {
        count++
      }
    })

    return count
  }
}
