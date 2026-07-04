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
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { FilterValue } from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'

// Filtros ESPECÍFICOS para la gestión de suscripciones (superadmin). Reutiliza el
// panel lateral compartido (side-filter-panel) igual que el resto del sistema.
@Component({
  selector: 'filter-subscription-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './filter-subscription-management.component.html',
})
export class FilterSubscriptionManagementComponent implements OnInit, OnDestroy {
  @Output() filterApplied = new EventEmitter<FilterValue>()
  @Output() filterCleared = new EventEmitter<void>()
  @Output() filterCountChanged = new EventEmitter<number>()

  public filterForm?: FormGroup

  readonly statuses = ['active', 'past_due', 'paused', 'canceled', 'none']

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

  private initForm(): void {
    this.filterForm = this._fb.group({
      search: [''],
      source: [''],
      status: [''],
      active: [''],
    })
  }

  private subscribeToFilterCommunication(): void {
    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this._destroy$))
      .subscribe((filter) => {
        if (filter && Object.keys(filter).length > 0) {
          this.filterForm?.patchValue({
            search: filter.search || '',
            source: filter.source || '',
            status: filter.status || '',
            active:
              filter.active === undefined || filter.active === ''
                ? ''
                : `${filter.active}`,
          })
          setTimeout(() => this.filterCountChanged.emit(this.getFilterCount()), 0)
        } else {
          this.resetFormOnly()
        }
      })
  }

  private resetFormOnly(): void {
    this.filterForm?.reset({ search: '', source: '', status: '', active: '' })
    setTimeout(() => this.filterCountChanged.emit(0), 0)
  }

  public onSubmit(): void {
    if (!this.filterForm) {
      return
    }
    const value = this.filterForm.value
    const cleaned: FilterValue = {}

    Object.keys(value).forEach((key) => {
      const raw = value[key]
      if (raw === '' || raw === null || raw === undefined) {
        return
      }
      if (key === 'active') {
        cleaned[key] = raw === 'true' || raw === true
      } else {
        cleaned[key] = raw
      }
    })

    this._filterCommunicationService.changeFilter(cleaned)
    this.filterApplied.emit(cleaned)
    this.filterCountChanged.emit(this.getFilterCount())
  }

  public onReset(): void {
    this.filterForm?.reset({ search: '', source: '', status: '', active: '' })
    this._filterCommunicationService.resetFilter()
    this.filterCountChanged.emit(0)
    setTimeout(() => {
      this.filterCleared.emit()
      this.filterApplied.emit({})
    }, 0)
  }

  private getFilterCount(): number {
    if (!this.filterForm) return 0
    const value = this.filterForm.value
    return Object.keys(value).filter(
      (key) =>
        value[key] !== '' && value[key] !== null && value[key] !== undefined
    ).length
  }

  statusLabelKey(status: string): string {
    switch (status) {
      case 'active':
        return 'SUBSCRIPTION.STATUS_ACTIVE'
      case 'past_due':
        return 'SUBSCRIPTION.STATUS_PAST_DUE'
      case 'canceled':
        return 'SUBSCRIPTION.STATUS_CANCELED'
      case 'paused':
        return 'SUBSCRIPTION.STATUS_PAUSED'
      default:
        return 'SUBSCRIPTION_ADMIN.STATUS_NONE'
    }
  }
}
