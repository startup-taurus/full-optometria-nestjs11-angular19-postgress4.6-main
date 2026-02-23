import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { NgSelectModule } from '@ng-select/ng-select'
import { Subject, takeUntil } from 'rxjs'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { BranchActions } from '@core/states/branch/branch.actions'
import {
  selectBranchFilterState,
  selectShouldLoadBranches,
} from '@core/states/branch/branch.selectors'
import { BranchFilterState } from '@core/services/api/branch.service'
import { Branch } from '@core/interfaces/api/user.interface'

@Component({
  selector: 'app-branch-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NgSelectModule],
  templateUrl: './branch-selector.component.html',
  styleUrls: ['./branch-selector.component.scss'],
})
export class BranchSelectorComponent implements OnInit, OnDestroy {
  filterState: BranchFilterState | null = null
  selectedBranchId: string | null = null
  hasActiveFilter = false
  isMinimalMode = true

  private destroy$ = new Subject<void>()
  private cdr = inject(ChangeDetectorRef)
  private store = inject(Store<AppState>)

  ngOnInit(): void {
    this.initializeBranchSelector()
    this.checkIfShouldLoadBranches()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeBranchSelector(): void {
    this.store
      .select(selectBranchFilterState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state: BranchFilterState) => {
          this.filterState = state
          this.selectedBranchId = state.selectedBranchId
          this.hasActiveFilter = state.selectedBranchId !== null

          this.cdr.markForCheck()
        },
        error: (error: any) => {},
      })
  }

  private checkIfShouldLoadBranches(): void {
    this.store
      .select(selectShouldLoadBranches)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shouldLoad) => {
          if (shouldLoad) {
            this.store.dispatch(BranchActions.loadAvailableBranches())
          }
        },
      })
  }

  onBranchChange(branchId: string | null): void {
    if (branchId === null) {
      this.store.dispatch(BranchActions.clearBranchFilter())
    } else {
      this.store.dispatch(BranchActions.setBranchFilter({ branchId }))
    }
  }

  get allBranchOptions(): Branch[] {
    return this.filterState?.availableBranches || []
  }

  getSelectedBranchName(): string {
    if (!this.selectedBranchId || !this.filterState?.availableBranches) {
      return 'Mi Sucursal'
    }

    const branch = this.filterState.availableBranches.find(
      (b) => b.id === this.selectedBranchId
    )
    return branch?.name || 'Sucursal Desconocida'
  }
}
