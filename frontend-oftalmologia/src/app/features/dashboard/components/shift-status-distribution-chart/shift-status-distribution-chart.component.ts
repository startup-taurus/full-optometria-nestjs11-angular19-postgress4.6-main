import {
  Component,
  OnInit,
  inject,
  signal,
  OnDestroy,
  ViewChild,
  AfterViewInit,
} from '@angular/core'
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts'
import type { ChartOptions } from '@core/interfaces/ui/apexchart.model'
import { DashboardService } from '../../services/dashboard.service'
import { ChartDataResponse } from '../../models/dashboard.model'
import { Store } from '@ngrx/store'
import { selectBranchFilterState } from '@core/states/branch/branch.selectors'
import { BranchFilterState } from '@core/services/api/branch.service'
import { Subscription } from 'rxjs'
import { TranslateModule } from '@ngx-translate/core'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { AuthenticationService } from '@core/services/api/auth.service'
import { skip, takeWhile } from 'rxjs/operators'

@Component({
  selector: 'shift-status-distribution-chart',
  standalone: true,
  imports: [NgApexchartsModule, TranslateModule, NgbTooltipModule],
  templateUrl: './shift-status-distribution-chart.component.html',
  styleUrl: './shift-status-distribution-chart.component.scss',
})
export class ShiftStatusDistributionChartComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('chart') chart?: ChartComponent

  private readonly dashboardService = inject(DashboardService)
  private readonly store = inject(Store)
  private readonly authService = inject(AuthenticationService)
  private branchSubscription?: Subscription
  private isComponentActive = true

  readonly isLoading = signal<boolean>(true)
  readonly chartData = signal<ChartDataResponse | null>(null)

  chartOptions: Partial<ChartOptions> = {
    series: [],
    chart: {
      height: 380,
      type: 'pie',
    },
    labels: [],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    legend: {
      position: 'bottom',
      fontSize: '13px',
      labels: {
        colors: '#64748b',
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontWeight: 600,
      },
      dropShadow: {
        enabled: false,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value: number) => `${value} citas`,
      },
    },
  }

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
        next: (branchState: BranchFilterState) => {
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
    this.dashboardService.getShiftStatusDistribution().subscribe({
      next: (data: ChartDataResponse) => {
        if (this.isComponentActive) {
          this.chartData.set(data)
          this.updateChart(data)
          this.isLoading.set(false)
        }
      },
      error: (error) => {
        if (this.isComponentActive) {
          this.isLoading.set(false)
        }
      },
    })
  }

  private updateChart(data: ChartDataResponse): void {
    if (!this.isComponentActive) {
      return
    }

    this.chartOptions = {
      ...this.chartOptions,
      series: data.data || [],
      labels: data.labels,
    }
  }
}
