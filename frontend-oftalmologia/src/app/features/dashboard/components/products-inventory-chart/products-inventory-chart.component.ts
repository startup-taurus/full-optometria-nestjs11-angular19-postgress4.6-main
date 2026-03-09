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
      tooltip: {
        ...this.chartOptions.tooltip,
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const value = series[seriesIndex][dataPointIndex]
          const category = w.globals.labels[dataPointIndex]
          
          let products: string[] = []
          if (dataPointIndex === 0) {
            products = data.details.lowStock.slice(0, 3)
          } else if (dataPointIndex === 1) {
            products = data.details.mediumStock.slice(0, 3)
          } else if (dataPointIndex === 2) {
            products = data.details.highStock.slice(0, 3)
          }

          const productsList = products.length > 0
            ? products.map(p => `<li style="margin: 2px 0;">${p}</li>`).join('')
            : '<li style="margin: 2px 0; color: #94a3b8;">No hay productos</li>'

          return `
            <div style="padding: 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 8px;">${category}</div>
              <div style="color: #64748b; margin-bottom: 6px; font-size: 13px;">${value} productos totales</div>
              <div style="font-weight: 500; color: #475569; font-size: 12px; margin-bottom: 4px;">Top 3:</div>
              <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155;">
                ${productsList}
              </ul>
            </div>
          `
        },
      },
    }
  }
}
