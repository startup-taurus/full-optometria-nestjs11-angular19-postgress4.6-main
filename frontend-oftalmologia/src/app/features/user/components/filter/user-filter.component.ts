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
import {
  ACTIVE_OPTIONS,
  BLOCKED_OPTIONS,
} from '@core/helpers/global/global.constants'
import { NgSelect } from '@core/interfaces/ui/ui.interface'
import { RoleService } from '@core/services/api/role.service'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { NgSelectModule } from '@ng-select/ng-select'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Observable, of, Subject } from 'rxjs'
import { map, takeUntil } from 'rxjs/operators'
import { Role } from '@core/interfaces/api/role.interface'

@Component({
  selector: 'user-filter',
  standalone: true,
  imports: [TranslateModule, NgSelectModule, CommonModule, ReactiveFormsModule],
  templateUrl: './user-filter.component.html',
  styleUrls: ['./user-filter.component.scss'],
})
export class UserFilterComponent implements OnInit, OnDestroy {
  @Output() filterApplied = new EventEmitter<any>()
  @Output() filterCleared = new EventEmitter<void>()

  public userFilterForm: FormGroup | undefined = undefined

  private _formBuilder = inject(FormBuilder)
  private _filterCommunicationService = inject(FilterCommunicationService)
  private _roleService = inject(RoleService)
  private _translateService = inject(TranslateService)
  private _destroy$ = new Subject<void>()

  public blocked$: Observable<NgSelect<boolean>[]> = of([])
  public active$: Observable<NgSelect<boolean>[]> = of([])
  public roles$: Observable<NgSelect<string>[]> = of([])

  ngOnInit(): void {
    this.loadRoles()
    this.userFilterForm = this.getConfigFilterForm()

    setTimeout(() => {
      this.loadTranslatedOptions()
    }, 0)

    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this._destroy$))
      .subscribe((filter) => {
        if (filter && Object.keys(filter).length === 0) {
          this.resetFormOnly()
        } else if (filter && Object.keys(filter).length > 0) {
          this.userFilterForm?.patchValue(filter)
        }
      })
  }

  private resetFormOnly(): void {
    this.userFilterForm?.reset()
    setTimeout(() => {
      this.filterCleared.emit()
    }, 0)
  }

  private loadTranslatedOptions(): void {
    const updateOptions = () => {
      this.blocked$ = of(
        BLOCKED_OPTIONS.map((option) => ({
          value: option.value,
          label: this._translateService.instant(option.label),
        }))
      )

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

  private loadRoles(): void {
    this.roles$ = this._roleService.getAllRoles('', 1, 100).pipe(
      map((response) => {
        if (response.data && response.data.result) {
          return response.data.result.map((role: Role) => ({
            value: role.id,
            label: role.roleName,
          }))
        }
        return []
      })
    )
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
      roleId: [null],
      isActive: [null],
      isLocked: [null],
    })
  }

  public onReset(): void {
    this.userFilterForm?.reset()
    this._filterCommunicationService.resetFilter()
    setTimeout(() => {
      this.filterCleared.emit()
    }, 0)
  }

  public onSubmit(): void {
    if (!this.userFilterForm?.valid) return

    const filterValues = this.userFilterForm?.value

    const cleanedFilter = Object.fromEntries(
      Object.entries(filterValues).filter(([key, value]) => {
        if (key === 'isActive' || key === 'isLocked') {
          return value !== null && value !== undefined
        }
        return value !== null && value !== '' && value !== undefined
      })
    )

    this._filterCommunicationService.changeFilter(cleanedFilter)
    this.filterApplied.emit(cleanedFilter)
  }

  public getFilterCount(): number {
    if (!this.userFilterForm) return 0

    const filterValues = this.userFilterForm.value
    return Object.entries(filterValues).filter(([key, value]) => {
      if (key === 'isActive' || key === 'isLocked') {
        return value !== null && value !== undefined
      }
      return value !== null && value !== '' && value !== undefined
    }).length
  }
}
