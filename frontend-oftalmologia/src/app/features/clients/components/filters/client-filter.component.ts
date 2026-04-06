import { CommonModule } from '@angular/common'
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { NgSelectModule } from '@ng-select/ng-select'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Observable, Subject, of } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  selector: 'client-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule],
  templateUrl: './client-filter.component.html',
  styleUrls: ['./client-filter.component.scss'],
})
export class ClientFilterComponent implements OnInit, OnDestroy {
  @Output() filterApplied = new EventEmitter<any>()
  @Output() filterCleared = new EventEmitter<void>()

  public clientFilterForm?: FormGroup
  public linkOptions$: Observable<Array<{ value: boolean; label: string }>> = of([])

  private _formBuilder = inject(FormBuilder)
  private _filterCommunicationService = inject(FilterCommunicationService)
  private _translateService = inject(TranslateService)
  private _destroy$ = new Subject<void>()

  ngOnInit(): void {
    this.clientFilterForm = this._formBuilder.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      documentNumber: [''],
      hasPatientLink: [null],
    })

    this.loadTranslatedOptions()

    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this._destroy$))
      .subscribe((filter) => {
        if (filter && Object.keys(filter).length === 0) {
          this.clientFilterForm?.reset()
          return
        }

        if (filter && Object.keys(filter).length > 0) {
          this.clientFilterForm?.patchValue(filter)
        }
      })
  }

  ngOnDestroy(): void {
    this._destroy$.next()
    this._destroy$.complete()
  }

  public onSubmit(): void {
    if (!this.clientFilterForm?.valid) return

    const values = this.clientFilterForm.value
    const cleanedFilter = Object.fromEntries(
      Object.entries(values).filter(([key, value]) => {
        if (key === 'hasPatientLink') {
          return value !== null && value !== undefined
        }
        return value !== null && value !== undefined && value !== ''
      }),
    )

    this._filterCommunicationService.changeFilter(cleanedFilter)
    this.filterApplied.emit(cleanedFilter)
  }

  public onReset(): void {
    this.clientFilterForm?.reset()
    this._filterCommunicationService.resetFilter()
    this.filterCleared.emit()
  }

  private loadTranslatedOptions(): void {
    const updateOptions = () => {
      this.linkOptions$ = of([
        {
          value: true,
          label: this._translateService.instant('CLIENT.HAS_PATIENT_LINK'),
        },
        {
          value: false,
          label: this._translateService.instant('CLIENT.WITHOUT_PATIENT_LINK'),
        },
      ])
    }

    updateOptions()

    this._translateService.onLangChange
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => updateOptions())
  }
}
