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
import { ProductsInventoryResponse } from '../../models/dashboard.model'
import { Store } from '@ngrx/store'
import { selectBranchFilterState } from '@core/states/branch/branch.selectors'
import { BranchFilterState } from '@core/services/api/branch.service'
import { Subscription } from 'rxjs'
import { TranslateModule } from '@ngx-translate/core'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { AuthenticationService } from '@core/services/api/auth.service'
import { skip, takeWhile } from 'rxjs/operators'

@Component({
  selector: 'products-inventory-chart',
  standalone: true,
  imports: [NgApexchartsModule, TranslateModule, NgbTooltipModule],
  templateUrl: './products-inventory-chart.component.html',
  styleUrl: './products-inventory-chart.component.scss',
})
export class ProductsInventoryChartComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('chart') chart?: ChartComponent

  private readonly dashboardService = inject(DashboardService)
  private readonly store = inject(Store)
  private readonly authService = inject(AuthenticationService)
  private branchSubscription?: Subscription
  private isComponentActive = true

  readonly isLoading = signal<boolean>(true)
  readonly chartData = signal<ProductsInventoryResponse | null>(null)

  chartOptions: Partial<ChartOptions> = {
    series: [
      {
        name: 'Productos',
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
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 8,
        distributed: true,
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
    colors: ['#ef4444', '#f59e0b', '#10b981'],
    xaxis: {
      categories: [],
      labels: {
        style: {
          colors: '#94a3b8',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Cantidad de Productos',
        style: {
          color: '#64748b',
        },
      },
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
      show: false,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value: number) => `${value} productos`,
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
    this.dashboardService.getProductsInventory().subscribe({
      next: (data: ProductsInventoryResponse) => {
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

  private updateChart(data: ProductsInventoryResponse): void {
    if (!this.isComponentActive) {
      return
    }

    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: 'Productos',
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
