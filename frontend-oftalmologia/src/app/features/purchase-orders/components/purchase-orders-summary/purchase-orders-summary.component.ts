import {
  Component,
  OnInit,
  inject,
  signal,
  OnDestroy,
  Output,
  EventEmitter,
  AfterViewInit,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { Store } from '@ngrx/store'
import { BranchFilterState } from '@core/services/api/branch.service'
import { selectBranchFilterState } from '@core/states/branch/branch.selectors'
import { Subscription } from 'rxjs'
import { skip, takeWhile } from 'rxjs/operators'
import { AuthenticationService } from '@core/services/api/auth.service'
import { DashboardService } from '../../../dashboard/services/dashboard.service'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { PurchaseOrdersSummaryResponse } from '../../../dashboard/models/dashboard.model'

@Component({
  selector: 'purchase-orders-summary',
  standalone: true,
  imports: [CommonModule, TranslateModule, NgbTooltipModule],
  templateUrl: './purchase-orders-summary.component.html',
  styleUrl: './purchase-orders-summary.component.scss',
})
export class PurchaseOrdersSummaryComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() filterApplied = new EventEmitter<string>()

  private readonly store = inject(Store)
  private readonly dashboardService = inject(DashboardService)
  private readonly authService = inject(AuthenticationService)
  private branchSubscription?: Subscription
  private isComponentActive = true

  readonly isLoading = signal<boolean>(true)
  readonly summaryData = signal<PurchaseOrdersSummaryResponse | null>(null)

  ngOnInit(): void {
    this.initializeBranchFilter()
  }

  ngAfterViewInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadData()
    }
  }

  ngOnDestroy(): void {
    this.isComponentActive = false
    this.branchSubscription?.unsubscribe()
  }

  private initializeBranchFilter(): void {
    this.branchSubscription = this.store
      .select(selectBranchFilterState)
      .pipe(
        skip(1),
        takeWhile(() => this.isComponentActive)
      )
      .subscribe({
        next: (_branchState: BranchFilterState) => {
          if (this.authService.isLoggedIn()) {
            this.loadData()
          }
        },
      })
  }

  private loadData(): void {
    if (!this.isComponentActive || !this.authService.isLoggedIn()) {
      return
    }

    this.isLoading.set(true)
    this.dashboardService.getPurchaseOrdersSummary().subscribe({
      next: (data: PurchaseOrdersSummaryResponse) => {
        if (this.isComponentActive) {
          this.summaryData.set(data)
          this.isLoading.set(false)
        }
      },
      error: (error) => {
        if (this.isComponentActive) {
          console.error('Error loading purchase orders summary:', error)
          this.isLoading.set(false)
        }
      },
    })
  }

  onCardClick(status: string): void {
    this.filterApplied.emit(status)
  }

  formatCurrency(value: number): string {
    const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0

    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeValue)
  }
}
