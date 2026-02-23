import {
  Component,
  OnInit,
  inject,
  signal,
  OnDestroy,
  ViewChild,
  AfterViewInit,
} from '@angular/core'
import { CommonModule } from '@angular/common'
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
  selector: 'appointments-trend-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, TranslateModule, NgbTooltipModule],
  templateUrl: './appointments-trend-chart.component.html',
  styleUrl: './appointments-trend-chart.component.scss',
})
export class AppointmentsTrendChartComponent
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
  readonly selectedMonths = signal<number>(3)

  readonly monthsOptions = [
    { value: 3, label: '3 meses' },
    { value: 6, label: '6 meses' },
    { value: 12, label: '12 meses' },
  ]

  chartOptions: Partial<ChartOptions> = {
    series: [
      {
        name: 'Citas Programadas',
        data: [],
      },
    ],
    chart: {
      height: 350,
      type: 'line',
      toolbar: {
        show: true,
        tools: {
          download: false,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: true,
        },
      },
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: true,
        speed: 800,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    markers: {
      size: 6,
      colors: ['#fff'],
      strokeColors: '#3b82f6',
      strokeWidth: 2,
      hover: {
        size: 8,
        sizeOffset: 3,
      },
    },
    dataLabels: {
      enabled: true,
      offsetY: -10,
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#3b82f6'],
      },
      background: {
        enabled: true,
        foreColor: '#3b82f6',
        padding: 4,
        borderRadius: 4,
        borderWidth: 0,
        opacity: 0.1,
      },
    },
    colors: ['#3b82f6'],
    xaxis: {
      categories: [],
      type: 'category',
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
          fontWeight: 500,
        },
        rotate: -45,
        rotateAlways: false,
      },
      title: {
        text: 'Período',
        style: {
          color: '#64748b',
          fontSize: '13px',
          fontWeight: 600,
        },
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
          fontWeight: 500,
        },
        formatter: (value: number) => Math.round(value).toString(),
      },
      title: {
        text: 'Cantidad de Citas',
        style: {
          color: '#64748b',
          fontSize: '13px',
          fontWeight: 600,
        },
      },
      min: 0,
      forceNiceScale: true,
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
      yaxis: {
        lines: {
          show: true,
        },
      },
      xaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 20,
        bottom: 0,
        left: 10,
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '14px',
      fontWeight: 600,
      offsetY: 0,
      markers: {
        strokeWidth: 2,
        fillColors: ['#3b82f6'],
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
    },
    tooltip: {
      enabled: true,
      theme: 'light',
      shared: false,
      intersect: false,
      followCursor: true,
      x: {
        show: true,
        format: 'dd MMM yyyy',
        formatter: (val: any, opts?: any) => {
          const category =
            this.chartOptions?.xaxis?.categories?.[opts?.dataPointIndex]
          if (category) {
            if (
              typeof category === 'string' &&
              /^\d{4}-\d{2}$/.test(category)
            ) {
              const [year, month] = category.split('-')
              const date = new Date(parseInt(year), parseInt(month) - 1)
              return date.toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric',
              })
            }
            if (
              typeof category === 'string' &&
              /^\d{4}-\d{2}-\d{2}$/.test(category)
            ) {
              const date = new Date(category)
              return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            }
            return category
          }
          return val
        },
      },
      y: {
        formatter: (value: number, opts?: any) => {
          return `${value} cita${value !== 1 ? 's' : ''}`
        },
        title: {
          formatter: (seriesName: string) => seriesName + ':',
        },
      },
      marker: {
        show: true,
      },
      style: {
        fontSize: '13px',
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
    const months = this.selectedMonths()
    this.dashboardService.getAppointmentsTrend(months).subscribe({
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

  onMonthsChange(event: Event): void {
    const select = event.target as HTMLSelectElement
    const months = Number(select.value)
    this.selectedMonths.set(months)
    if (this.authService.isLoggedIn()) {
      this.loadData()
    }
  }

  private updateChart(data: ChartDataResponse): void {
    if (!this.isComponentActive) {
      return
    }

    const series = data.series
      ? data.series.map((s: { name: string; data: number[] }) => ({
          name: s.name,
          data: s.data,
        }))
      : [
          {
            name: 'Citas Programadas',
            data: data.data || [],
          },
        ]

    this.chartOptions = {
      ...this.chartOptions,
      series: series,
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: data.labels,
      },
    }
  }
}
