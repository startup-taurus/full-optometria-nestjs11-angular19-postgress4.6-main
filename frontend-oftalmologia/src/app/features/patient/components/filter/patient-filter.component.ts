import { CommonModule } from '@angular/common'
import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
} from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { ACTIVE_OPTIONS } from '@core/helpers/global/global.constants'
import { NgSelect } from '@core/interfaces/ui/ui.interface'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { NgSelectModule } from '@ng-select/ng-select'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Observable, of, Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  selector: 'patient-filter',
  standalone: true,
  imports: [TranslateModule, NgSelectModule, CommonModule, ReactiveFormsModule],
  templateUrl: './patient-filter.component.html',
  styleUrls: ['./patient-filter.component.scss'],
})
export class PatientFilterComponent implements OnInit, OnDestroy {
  @Output() filterApplied = new EventEmitter<any>()
  @Output() filterCleared = new EventEmitter<void>()

  public patientFilterForm: FormGroup | undefined = undefined

  private _formBuilder = inject(FormBuilder)
  private _filterCommunicationService = inject(FilterCommunicationService)
  private _translateService = inject(TranslateService)
  private _destroy$ = new Subject<void>()

  public active$: Observable<NgSelect<boolean>[]> = of([])

  ngOnInit(): void {
    this.patientFilterForm = this.getConfigFilterForm()

    setTimeout(() => {
      this.loadTranslatedOptions()
    }, 0)

    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this._destroy$))
      .subscribe((filter) => {
        if (filter && Object.keys(filter).length === 0) {
          this.resetFormOnly()
        } else if (filter && Object.keys(filter).length > 0) {
          this.patientFilterForm?.patchValue(filter)
        }
      })
  }

  private resetFormOnly(): void {
    this.patientFilterForm?.reset()
    setTimeout(() => {
      this.filterCleared.emit()
    }, 0)
  }

  private loadTranslatedOptions(): void {
    const updateOptions = () => {
      this.active$ = of(
        ACTIVE_OPTIONS.map((option) => ({
          value: option.value,
          label: this._translateService.instant(option.label),
        }))
      )
    }

    updateOptions()

    this._translateService.onLangChange
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        updateOptions()
      })
  }

  ngOnDestroy(): void {
    this._destroy$.next()
    this._destroy$.complete()
  }

  private getConfigFilterForm(): FormGroup {
    return this._formBuilder.group({
      search: [''],
      firstName: [''],
      lastName: [''],
      email: [''],
      documentNumber: [''],
      mobilePhone: [''],
      address: [''],
      isActive: [null],
    })
  }

  public onReset(): void {
    this.patientFilterForm?.reset()
    this._filterCommunicationService.resetFilter()
    setTimeout(() => {
      this.filterCleared.emit()
    }, 0)
  }

  public onSubmit(): void {
    if (!this.patientFilterForm?.valid) return

    const filterValues = this.patientFilterForm?.value

    const cleanedFilter = Object.fromEntries(
      Object.entries(filterValues).filter(([key, value]) => {
        if (key === 'isActive') {
          return value !== null && value !== undefined
        }
        return value !== null && value !== '' && value !== undefined
      })
    )

    this._filterCommunicationService.changeFilter(cleanedFilter)
    this.filterApplied.emit(cleanedFilter)
  }

  public getFilterCount(): number {
    if (!this.patientFilterForm) return 0

    const filterValues = this.patientFilterForm.value
    return Object.entries(filterValues).filter(([key, value]) => {
      if (key === 'isActive') {
        return value !== null && value !== undefined
      }
      return value !== null && value !== '' && value !== undefined
    }).length
  }
}
