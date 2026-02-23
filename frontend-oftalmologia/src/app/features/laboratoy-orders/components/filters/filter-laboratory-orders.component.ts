import {
  Component,
  EventEmitter,
  Output,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'filter-laboratory-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './filter-laboratory-orders.component.html',
  styleUrl: './filter-laboratory-orders.component.scss',
})
export class FilterLaboratoryOrdersComponent implements OnInit, OnDestroy {
  @Output() filterApplied = new EventEmitter<any>()
  @Output() filterCleared = new EventEmitter<void>()
  @Output() filterCountChanged = new EventEmitter<number>()

  private formBuilder = inject(FormBuilder)
  private filterCommunicationService = inject(FilterCommunicationService)
  private destroy$ = new Subject<void>()

  public laboratoryOrdersFilterForm!: FormGroup

  ngOnInit(): void {
    this.initializeForm()
    this.subscribeToFilterCommunication()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeForm(): void {
    this.laboratoryOrdersFilterForm = this.formBuilder.group({
      firstName: [''],
      lastName: [''],
      cedula: [''],
      email: [''],
      mobilePhone: [''],
      status: [''],
      deliveryDate: [''],
    })
  }

  private subscribeToFilterCommunication(): void {
    this.filterCommunicationService.currentFilter
      .pipe(takeUntil(this.destroy$))
      .subscribe((filter) => {
        if (filter && Object.keys(filter).length === 0) {
          this.resetFormOnly()
        } else if (filter && Object.keys(filter).length > 0) {
          this.laboratoryOrdersFilterForm.patchValue(filter, {
            emitEvent: false,
          })
        }
      })
  }

  private resetFormOnly(): void {
    this.laboratoryOrdersFilterForm.reset()
    setTimeout(() => {
      this.filterCountChanged.emit(0)
    }, 0)
  }

  public onSubmit(): void {
    const formValue = this.laboratoryOrdersFilterForm.value

    const filters = Object.keys(formValue).reduce((acc: any, key) => {
      if (formValue[key] && formValue[key].toString().trim() !== '') {
        acc[key] = formValue[key]
      }
      return acc
    }, {})

    this.filterCommunicationService.changeFilter(filters)
    this.filterApplied.emit(filters)

    const filterCount = this.getFilterCount()
    this.filterCountChanged.emit(filterCount)
  }

  public onClear(): void {
    this.laboratoryOrdersFilterForm.reset()
    this.filterCommunicationService.resetFilter()
    this.filterCountChanged.emit(0)

    setTimeout(() => {
      this.filterCleared.emit()
      this.filterApplied.emit({})
    }, 0)
  }

  public hasActiveFilters(): boolean {
    if (!this.laboratoryOrdersFilterForm) return false

    const formValue = this.laboratoryOrdersFilterForm.value
    return Object.entries(formValue).some(([key, value]) => {
      return value !== '' && value !== null && value !== undefined
    })
  }

  public getFilterCount(): number {
    if (!this.laboratoryOrdersFilterForm) return 0

    const formValue = this.laboratoryOrdersFilterForm.value
    return Object.entries(formValue).filter(([key, value]) => {
      return value !== '' && value !== null && value !== undefined
    }).length
  }

  public getActiveFiltersCount(): number {
    return this.getFilterCount()
  }
}
