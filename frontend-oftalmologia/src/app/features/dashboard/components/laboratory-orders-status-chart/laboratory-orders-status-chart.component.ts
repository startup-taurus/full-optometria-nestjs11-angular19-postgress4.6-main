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
  selector: 'laboratory-orders-status-chart',
  standalone: true,
  imports: [NgApexchartsModule, TranslateModule, NgbTooltipModule],
  templateUrl: './laboratory-orders-status-chart.component.html',
  styleUrl: './laboratory-orders-status-chart.component.scss',
})
export class LaboratoryOrdersStatusChartComponent
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
    series: [
      {
        name: 'Órdenes',
        data: [],
      },
    ],
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 8,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ['#304758'],
      },
    },
    colors: ['#f59e0b', '#10b981'], // Solo 2 colores: Pendientes (naranja) y Confirmadas (verde)
    xaxis: {
      categories: [],
      labels: {
        style: {
          colors: '#94a3b8',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#94a3b8',
        },
        formatter: (value: number) => Math.round(value).toString(),
      },
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: '#64748b',
      },
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value: number) => `${value} órdenes`,
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
    this.dashboardService.getLaboratoryOrdersStatus().subscribe({
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
      series: [
        {
          name: 'Órdenes',
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
