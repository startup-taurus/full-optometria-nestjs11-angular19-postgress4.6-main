import {
  Component,
  OnInit,
  inject,
  signal,
  OnDestroy,
  AfterViewInit,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { NgApexchartsModule } from 'ng-apexcharts'
import type { ChartOptions } from '@core/interfaces/ui/apexchart.model'
import { DashboardService } from '../../services/dashboard.service'
import { TopProductsSoldResponse } from '../../models/dashboard.model'
import { Store } from '@ngrx/store'
import { selectBranchFilterState } from '@core/states/branch/branch.selectors'
import { BranchFilterState } from '@core/services/api/branch.service'
import { Subscription } from 'rxjs'
import { TranslateModule } from '@ngx-translate/core'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { AuthenticationService } from '@core/services/api/auth.service'
import { skip, takeWhile } from 'rxjs/operators'

@Component({
  selector: 'app-top-products-sold-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, TranslateModule, NgbTooltipModule],
  templateUrl: './top-products-sold-chart.component.html',
  styleUrl: './top-products-sold-chart.component.scss',
})
export class TopProductsSoldChartComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  private readonly dashboardService = inject(DashboardService)
  private readonly store = inject(Store)
  private readonly authService = inject(AuthenticationService)
  private branchSubscription?: Subscription
  private isComponentActive = true

  readonly isLoading = signal<boolean>(true)
  readonly chartData = signal<TopProductsSoldResponse | null>(null)
  readonly selectedMonths = signal<number>(1)
  readonly isTableView = signal<boolean>(false)

  readonly monthsOptions = [
    { value: 1, label: '1 mes' },
    { value: 3, label: '3 meses' },
    { value: 6, label: '6 meses' },
  ]

  chartOptions: Partial<ChartOptions> = {
    series: [
      {
        name: 'Unidades vendidas',
        data: [],
      },
    ],
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        speed: 700,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '58%',
        borderRadius: 6,
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: ['#2563eb'],
    xaxis: {
      categories: [],
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
          fontWeight: 500,
        },
        rotate: -35,
        rotateAlways: false,
      },
    },
    yaxis: {
      title: {
        text: 'Unidades vendidas',
        style: {
          color: '#64748b',
          fontSize: '13px',
          fontWeight: 600,
        },
      },
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
          fontWeight: 500,
        },
        formatter: (value: number) => Math.round(value).toString(),
      },
      min: 0,
      forceNiceScale: true,
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
    },
    legend: {
      show: false,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value: number) => `${value} unidades`,
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
    this.dashboardService.getTopProductsSold(this.selectedMonths()).subscribe({
      next: (data: TopProductsSoldResponse) => {
        if (this.isComponentActive) {
          this.chartData.set(data)
          this.updateChart(data)
          this.isLoading.set(false)
        }
      },
      error: () => {
        if (this.isComponentActive) {
          this.isLoading.set(false)
        }
      },
    })
  }

  onMonthsChange(event: Event): void {
    const select = event.target as HTMLSelectElement
    const months = Number(select.value)
    this.selectedMonths.set(months)
    if (this.authService.isLoggedIn()) {
      this.loadData()
    }
  }

  toggleView(): void {
    this.isTableView.set(!this.isTableView())
  }

  private updateChart(data: TopProductsSoldResponse): void {
    if (!this.isComponentActive) {
      return
    }

    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: 'Unidades vendidas',
          data: data.data || [],
        },
      ],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: data.labels,
      },
    }
  }
}
