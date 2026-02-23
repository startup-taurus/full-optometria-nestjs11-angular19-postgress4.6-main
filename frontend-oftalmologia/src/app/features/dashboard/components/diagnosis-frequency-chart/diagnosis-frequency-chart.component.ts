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
import { takeWhile } from 'rxjs/operators'

@Component({
  selector: 'diagnosis-frequency-chart',
  standalone: true,
  imports: [NgApexchartsModule, TranslateModule, NgbTooltipModule],
  templateUrl: './diagnosis-frequency-chart.component.html',
  styleUrl: './diagnosis-frequency-chart.component.scss',
})
export class DiagnosisFrequencyChartComponent
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
      type: 'donut',
      events: {
        dataPointMouseEnter: (e: any, ctx: any, cfg: any) => {},
        dataPointMouseLeave: (e: any, ctx: any, cfg: any) => {},
      },
    },
    labels: [],
    colors: [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#ec4899',
      '#14b8a6',
      '#f97316',
      '#6366f1',
      '#84cc16',
    ],
    legend: {
      position: 'bottom',
      fontSize: '13px',
      labels: { colors: '#64748b' },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '16px', color: '#64748b' },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 600,
              color: '#1e293b',
            },
            total: {
              show: true,
              label: 'Total Diagnósticos',
              fontSize: '14px',
              color: '#64748b',
              formatter: () => {
                const data = this.chartData()
                return data ? data.total.toString() : '0'
              },
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      fillSeriesColor: true,
      theme: 'light',
      y: {
        formatter: (_: number, opts: any) => {
          const i =
            typeof opts.dataPointIndex === 'number'
              ? opts.dataPointIndex
              : opts.seriesIndex
          const lbl = opts?.w?.globals?.labels?.[i]
          return lbl || ''
        },
      },
      style: { fontSize: '13px' },
    } as any,

    responsive: [
      {
        breakpoint: 480,
        options: { chart: { height: 300 }, legend: { position: 'bottom' } },
      },
    ],
  }

  ngOnInit(): void {
    this.initializeBranchFilter()
  }

  ngAfterViewInit(): void {
    if (this.authService.isLoggedIn()) this.loadData()
  }

  ngOnDestroy(): void {
    this.isComponentActive = false
    this.branchSubscription?.unsubscribe()
  }

  private initializeBranchFilter(): void {
    this.branchSubscription = this.store
      .select(selectBranchFilterState)
      .pipe(takeWhile(() => this.isComponentActive))
      .subscribe({
        next: (branchState: BranchFilterState) => {
          if (this.authService.isLoggedIn()) this.loadData()
        },
      })
  }

  private loadData(): void {
    if (!this.isComponentActive || !this.authService.isLoggedIn()) return
    this.isLoading.set(true)
    this.dashboardService.getDiagnosisFrequency().subscribe({
      next: (data: ChartDataResponse) => {
        if (this.isComponentActive) {
          this.chartData.set(data)
          this.updateChart(data)
          this.isLoading.set(false)
        }
      },
      error: (err) => {
        if (this.isComponentActive) this.isLoading.set(false)
      },
    })
  }

  private updateChart(data: ChartDataResponse): void {
    if (!this.isComponentActive) return
    this.chartOptions = {
      ...this.chartOptions,
      series: data.data,
      labels: data.labels,
    }
  }
}
