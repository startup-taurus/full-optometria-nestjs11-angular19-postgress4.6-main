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
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgSelectModule } from '@ng-select/ng-select'
import { FilterValue } from '../../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { CategoryService } from '@core/services/api/category.service'
import { SubcategoryService } from '@core/services/api/subcategory.service'
import { SupplierService } from '@core/services/api/supplier.service'
import {
  Category,
  Subcategory,
  Supplier,
} from '@core/interfaces/api/inventory.interface'
import { NgSelect } from '@core/interfaces/ui/ui.interface'
import { ACTIVE_OPTIONS } from '@core/helpers/global/global.constants'
import { Observable, of, Subject } from 'rxjs'
import {
  map,
  takeUntil,
  startWith,
  retry,
  timeout,
  catchError,
} from 'rxjs/operators'

@Component({
  selector: 'filter-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule],
  templateUrl: './filter-inventory.component.html',
  styleUrl: './filter-inventory.component.scss',
})
export class FilterInventoryComponent implements OnInit, OnDestroy {
  @Output() filterSubmit = new EventEmitter<FilterValue>()
  @Output() filterClear = new EventEmitter<void>()
  @Output() filterCountChanged = new EventEmitter<number>()

  public inventoryFilterForm?: FormGroup

  public categories$: Observable<Category[]> = of([])
  public subcategories$: Observable<Subcategory[]> = of([])
  public suppliers$: Observable<Supplier[]> = of([])
  public statusOptions$: Observable<NgSelect<boolean>[]> = of([])

  private _fb = inject(FormBuilder)
  private _filterCommunicationService = inject(FilterCommunicationService)
  private _categoryService = inject(CategoryService)
  private _subcategoryService = inject(SubcategoryService)
  private _supplierService = inject(SupplierService)
  private _translateService = inject(TranslateService)
  private _destroy$ = new Subject<void>()

  ngOnInit(): void {
    this.initForm()
    this.loadData()
    this.loadTranslatedOptions()
    this.subscribeToFilterCommunication()
  }

  ngOnDestroy(): void {
    this._destroy$.next()
    this._destroy$.complete()
  }

  private loadData(): void {
    this.categories$ = this._categoryService.getAll().pipe(
      timeout(30000),
      retry(1),
      startWith([]),
      catchError(() => of([]))
    )

    this.subcategories$ = this._subcategoryService.getAll().pipe(
      timeout(30000),
      retry(1),
      startWith([]),
      catchError(() => of([]))
    )

    this.suppliers$ = this._supplierService.findSuppliers({}).pipe(
      timeout(30000),
      retry(1),
      map((response: any) => response?.data?.data?.result || []),
      startWith([]),
      catchError(() => of([]))
    )
  }

  private loadTranslatedOptions(): void {
    const updateStatusOptions = () => {
      this.statusOptions$ = of(
        ACTIVE_OPTIONS.map((option) => ({
          value: option.value,
          label: this._translateService.instant(option.label),
        }))
      )
    }

    updateStatusOptions()

    this._translateService.onLangChange
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        updateStatusOptions()
      })
  }

  private subscribeToFilterCommunication(): void {
    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this._destroy$))
      .subscribe((filter) => {
        if (filter && Object.keys(filter).length === 0) {
          this.resetFormOnly()
        } else if (filter && Object.keys(filter).length > 0) {
          const formValue: any = {
            code: filter.code || '',
            name: filter.name || '',
            brand: filter.brand || '',
            unitPrice: filter.unitPrice || '',
            quantity: filter.quantity || '',
            categoryId: filter.categoryId || null,
            subcategoryId: filter.subcategoryId || null,
            supplierId: filter.supplierId || null,
            isActive: filter.isActive !== undefined ? filter.isActive : null,
          }
          this.inventoryFilterForm?.patchValue(formValue)

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
    this.inventoryFilterForm?.reset()
    setTimeout(() => {
      this.filterCountChanged.emit(0)
    }, 0)
  }

  private initForm(): void {
    this.inventoryFilterForm = this._fb.group({
      code: [''],
      name: [''],
      brand: [''],
      unitPrice: [''],
      quantity: [''],
      categoryId: [null],
      subcategoryId: [null],
      supplierId: [null],
      isActive: [null],
    })
  }

  public onSubmit(): void {
    if (this.inventoryFilterForm) {
      const formValue = this.inventoryFilterForm.value
      const cleanedFilter: FilterValue = {}

      Object.keys(formValue).forEach((key) => {
        const value = formValue[key]
        if (key === 'isActive') {
          if (value !== null && value !== undefined) {
            cleanedFilter[key] = value
          }
        } else if (value !== '' && value !== null && value !== undefined) {
          cleanedFilter[key] = value
        }
      })

      this._filterCommunicationService.changeFilter(cleanedFilter)
      this.filterSubmit.emit(cleanedFilter)

      const filterCount = this.getFilterCount()
      this.filterCountChanged.emit(filterCount)
    }
  }

  public onReset(): void {
    this.inventoryFilterForm?.reset()
    this._filterCommunicationService.resetFilter()
    this.filterCountChanged.emit(0)
    setTimeout(() => {
      this.filterClear.emit()
    }, 0)
  }

  public hasActiveFilters(): boolean {
    if (!this.inventoryFilterForm) return false

    const formValue = this.inventoryFilterForm.value
    return Object.entries(formValue).some(([key, value]) => {
      if (key === 'isActive') {
        return value !== null && value !== undefined
      }
      return value !== '' && value !== null && value !== undefined
    })
  }

  public getFilterCount(): number {
    if (!this.inventoryFilterForm) return 0

    const formValue = this.inventoryFilterForm.value
    return Object.entries(formValue).filter(([key, value]) => {
      if (key === 'isActive') {
        return value !== null && value !== undefined
      }
      return value !== '' && value !== null && value !== undefined
    }).length
  }
}
