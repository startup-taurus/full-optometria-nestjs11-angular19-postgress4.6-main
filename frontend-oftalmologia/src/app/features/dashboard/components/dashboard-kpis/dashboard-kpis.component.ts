import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { Store } from '@ngrx/store'
import { Subscription, forkJoin, of } from 'rxjs'
import { catchError, skip, takeWhile } from 'rxjs/operators'
import { DashboardService } from '../../services/dashboard.service'
import { selectBranchFilterState } from '@core/states/branch/branch.selectors'
import { selectUser } from '@core/states/auth/auth.selectors'
import { AuthenticationService } from '@core/services/api/auth.service'

interface KpiCard {
  key: string
  variant: string
  icon: string
  labelKey: string
  descKey: string
  value: string
  alert?: boolean
}

@Component({
  selector: 'dashboard-kpis',
  standalone: true,
  imports: [CommonModule, TranslateModule, NgbTooltipModule],
  templateUrl: './dashboard-kpis.component.html',
  styleUrl: './dashboard-kpis.component.scss',
})
export class DashboardKpisComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService)
  private readonly store = inject(Store)
  private readonly authService = inject(AuthenticationService)

  private branchSubscription?: Subscription
  private userSubscription?: Subscription
  private isComponentActive = true

  readonly isLoading = signal<boolean>(true)
  readonly greetingKey = signal<string>('DASHBOARD.GREETING.MORNING')
  readonly userName = signal<string>('')
  readonly today = new Date()
  readonly cards = signal<KpiCard[]>([])

  ngOnInit(): void {
    this.resolveGreeting()
    this.subscribeToUser()
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
    this.userSubscription?.unsubscribe()
  }

  private resolveGreeting(): void {
    const hour = this.today.getHours()
    if (hour < 12) {
      this.greetingKey.set('DASHBOARD.GREETING.MORNING')
    } else if (hour < 19) {
      this.greetingKey.set('DASHBOARD.GREETING.AFTERNOON')
    } else {
      this.greetingKey.set('DASHBOARD.GREETING.EVENING')
    }
  }

  private subscribeToUser(): void {
    this.userSubscription = this.store
      .select(selectUser)
      .pipe(takeWhile(() => this.isComponentActive))
      .subscribe((user) => {
        this.userName.set(user?.firstName || user?.username || '')
      })
  }

  private initializeBranchFilter(): void {
    this.branchSubscription = this.store
      .select(selectBranchFilterState)
      .pipe(
        skip(1),
        takeWhile(() => this.isComponentActive)
      )
      .subscribe(() => {
        if (this.authService.isLoggedIn()) {
          this.loadData()
        }
      })
  }

  private loadData(): void {
    if (!this.isComponentActive || !this.authService.isLoggedIn()) {
      return
    }

    this.isLoading.set(true)

    forkJoin({
      patients: this.dashboardService
        .getPatientsAgeDemographics()
        .pipe(catchError(() => of(null))),
      appointments: this.dashboardService
        .getAppointmentsTrend()
        .pipe(catchError(() => of(null))),
      labOrders: this.dashboardService
        .getLaboratoryOrdersStatus()
        .pipe(catchError(() => of(null))),
      inventory: this.dashboardService
        .getProductsInventory()
        .pipe(catchError(() => of(null))),
      purchaseOrders: this.dashboardService
        .getPurchaseOrdersSummary()
        .pipe(catchError(() => of(null))),
    }).subscribe((result) => {
      if (!this.isComponentActive) {
        return
      }
      this.cards.set(this.buildCards(result))
      this.isLoading.set(false)
    })
  }

  private buildCards(result: {
    patients: { total: number } | null
    appointments: { total: number } | null
    labOrders: { data?: number[]; total: number } | null
    inventory: { data?: number[]; total: number } | null
    purchaseOrders: { amounts: { gross: number; invoiced: number } } | null
  }): KpiCard[] {
    const lowStock = result.inventory?.data?.[0] ?? 0
    const labPending = result.labOrders?.data?.[0] ?? 0

    return [
      {
        key: 'patients',
        variant: 'kpi-patients',
        icon: 'ti ti-users',
        labelKey: 'DASHBOARD.KPIS.TOTAL_PATIENTS',
        descKey: 'DASHBOARD.KPIS.TOTAL_PATIENTS_DESC',
        value: this.formatNumber(result.patients?.total ?? 0),
      },
      {
        key: 'appointments',
        variant: 'kpi-appointments',
        icon: 'ti ti-calendar-check',
        labelKey: 'DASHBOARD.KPIS.APPOINTMENTS',
        descKey: 'DASHBOARD.KPIS.APPOINTMENTS_DESC',
        value: this.formatNumber(result.appointments?.total ?? 0),
      },
      {
        key: 'labPending',
        variant: 'kpi-lab',
        icon: 'ti ti-flask',
        labelKey: 'DASHBOARD.KPIS.LAB_PENDING',
        descKey: 'DASHBOARD.KPIS.LAB_PENDING_DESC',
        value: this.formatNumber(labPending),
      },
      {
        key: 'lowStock',
        variant: 'kpi-stock',
        icon: 'ti ti-alert-triangle',
        labelKey: 'DASHBOARD.KPIS.LOW_STOCK',
        descKey: 'DASHBOARD.KPIS.LOW_STOCK_DESC',
        value: this.formatNumber(lowStock),
        alert: lowStock > 0,
      },
      {
        key: 'sold',
        variant: 'kpi-sold',
        icon: 'ti ti-chart-line',
        labelKey: 'DASHBOARD.KPIS.TOTAL_SOLD',
        descKey: 'DASHBOARD.KPIS.TOTAL_SOLD_DESC',
        value: this.formatCurrency(result.purchaseOrders?.amounts?.gross ?? 0),
      },
      {
        key: 'invoiced',
        variant: 'kpi-invoiced',
        icon: 'ti ti-receipt',
        labelKey: 'DASHBOARD.KPIS.TOTAL_INVOICED',
        descKey: 'DASHBOARD.KPIS.TOTAL_INVOICED_DESC',
        value: this.formatCurrency(
          result.purchaseOrders?.amounts?.invoiced ?? 0
        ),
      },
    ]
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('es-EC').format(value)
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }
}
