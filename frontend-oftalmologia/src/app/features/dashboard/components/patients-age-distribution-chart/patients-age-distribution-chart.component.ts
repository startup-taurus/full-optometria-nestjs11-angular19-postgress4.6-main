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
  selector: 'patients-age-distribution-chart',
  standalone: true,
  imports: [NgApexchartsModule, TranslateModule, NgbTooltipModule],
  templateUrl: './patients-age-distribution-chart.component.html',
  styleUrl: './patients-age-distribution-chart.component.scss',
})
export class PatientsAgeDistributionChartComponent
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
        name: 'Pacientes',
        data: [],
      },
    ],
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 8,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      offsetX: 30,
      style: {
        fontSize: '12px',
        colors: ['#304758'],
      },
    },
    colors: ['#6366f1'],
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
      },
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value: number) => `${value} pacientes`,
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
    this.dashboardService.getPatientsAgeDemographics().subscribe({
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
          name: 'Pacientes',
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
