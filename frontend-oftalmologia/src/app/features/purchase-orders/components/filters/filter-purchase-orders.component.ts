import { CommonModule } from '@angular/common'
import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'

import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { PurchaseOrderStatus } from '@core/interfaces/api/purchase-order.interface'
import { FilterValue } from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'

@Component({
  selector: 'filter-purchase-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './filter-purchase-orders.component.html',
  styleUrl: './filter-purchase-orders.component.scss',
})
export class FilterPurchaseOrdersComponent implements OnInit, OnDestroy {
  @Output() filterApplied = new EventEmitter<FilterValue>()
  @Output() filterCleared = new EventEmitter<void>()
  @Output() filterCountChanged = new EventEmitter<number>()

  public purchaseOrdersFilterForm?: FormGroup
  public purchaseOrderStatus = PurchaseOrderStatus

  private fb = inject(FormBuilder)
  private filterCommunicationService = inject(FilterCommunicationService)
  private destroy$ = new Subject<void>()

  ngOnInit(): void {
    this.initForm()
    this.subscribeToFilterCommunication()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initForm(): void {
    this.purchaseOrdersFilterForm = this.fb.group({
      status: [''],
      shouldInvoice: [''],
    })
  }

  private subscribeToFilterCommunication(): void {
    this.filterCommunicationService.currentFilter
      .pipe(takeUntil(this.destroy$))
      .subscribe((filter) => {
        if (filter && Object.keys(filter).length === 0) {
          this.resetFormOnly()
          return
        }

        if (filter && Object.keys(filter).length > 0) {
          const formValue = {
            status: filter['status'] || '',
            shouldInvoice:
              filter['shouldInvoice'] !== undefined
                ? filter['shouldInvoice']
                  ? 'true'
                  : 'false'
                : '',
          }

          this.purchaseOrdersFilterForm?.patchValue(formValue)

          setTimeout(() => {
            this.filterCountChanged.emit(this.getFilterCount())
          }, 0)

          return
        }

        this.resetFormOnly()
      })
  }

  private resetFormOnly(): void {
    this.purchaseOrdersFilterForm?.reset()
    this.filterCountChanged.emit(0)
    setTimeout(() => {
      this.filterCleared.emit()
    }, 0)
  }

  public onSubmit(): void {
    if (!this.purchaseOrdersFilterForm) {
      return
    }

    const formValue = this.purchaseOrdersFilterForm.value
    const cleanedFilter: FilterValue = {}

    if (formValue.status) {
      cleanedFilter['status'] = formValue.status
    }

    if (formValue.shouldInvoice !== '') {
      cleanedFilter['shouldInvoice'] = formValue.shouldInvoice === 'true'
    }

    this.filterCommunicationService.changeFilter(cleanedFilter)
    this.filterApplied.emit(cleanedFilter)
    this.filterCountChanged.emit(this.getFilterCount())
  }

  public onReset(): void {
    this.purchaseOrdersFilterForm?.reset()
    this.filterCommunicationService.resetFilter()
    this.filterCountChanged.emit(0)

    setTimeout(() => {
      this.filterCleared.emit()
      this.filterApplied.emit({})
    }, 0)
  }

  private getFilterCount(): number {
    if (!this.purchaseOrdersFilterForm) {
      return 0
    }

    const formValue = this.purchaseOrdersFilterForm.value
    return Object.values(formValue).filter(
      (value) => value !== '' && value !== null && value !== undefined
    ).length
  }
}
