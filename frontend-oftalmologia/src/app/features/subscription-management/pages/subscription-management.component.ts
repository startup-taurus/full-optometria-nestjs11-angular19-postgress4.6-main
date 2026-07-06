import { CommonModule } from '@angular/common'
import {
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import Swal from 'sweetalert2'
import { PageTitleComponent } from '@/app/shared/components/layouts/page-title/page-title.component'
import { SideFilterPanelComponent } from '@/app/shared/components/filters/side-filter-panel/side-filter-panel.component'
import { environment } from '@environment/environment'
import {
  SWAL_DELETE_CONFIRM_CONFIG,
  SWAL_ERROR_CONFIG,
  SWAL_SUCCESS_CONFIG,
} from '@core/helpers/ui/ui.constants'
import { SubscriptionAdminService } from '@core/services/api/subscription-admin.service'
import {
  AdminSubscriptionRow,
  ListSubscriptionsQuery,
  Plan,
} from '@core/interfaces/api/subscription.interface'
import { ManageSubscriptionModalComponent } from '../components/manage-subscription-modal/manage-subscription-modal.component'
import { FilterSubscriptionManagementComponent } from '../components/filters/filter-subscription-management.component'

@Component({
  selector: 'subscription-management-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PageTitleComponent,
    SideFilterPanelComponent,
  ],
  templateUrl: './subscription-management.component.html',
  styleUrls: ['./subscription-management.component.scss'],
})
export class SubscriptionManagementComponent implements OnInit {
  private readonly subscriptionAdminService = inject(SubscriptionAdminService)
  private readonly modalService = inject(NgbModal)
  private readonly translate = inject(TranslateService)
  private readonly destroyRef = inject(DestroyRef)

  rows: AdminSubscriptionRow[] = []
  plans: Plan[] = []
  loading = true

  // Filtros específicos (empresa, origen del cobro, estado suscripción, estado empresa)
  // aplicados desde el panel lateral compartido.
  public sideFilterComponent = FilterSubscriptionManagementComponent
  private currentFilters: ListSubscriptionsQuery = {}

  currentPage = 1
  pageSize = 12
  totalCount = 0
  totalPages = 0
  hasNext = false
  hasPrevious = false

  @ViewChild('sideFilterPanel', { static: false })
  public sideFilterPanel?: SideFilterPanelComponent

  ngOnInit(): void {
    this.loadPlans()
    this.loadData()
  }

  private loadPlans(): void {
    this.subscriptionAdminService
      .getPlans()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.plans = response.data?.result ?? []
        },
      })
  }

  loadData(): void {
    this.loading = true
    this.subscriptionAdminService
      .list({
        ...this.currentFilters,
        page: this.currentPage,
        limit: this.pageSize,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response.data
          this.rows = data?.result ?? []
          this.totalCount = data?.totalCount ?? 0
          this.totalPages = data?.totalPages ?? 0
          this.hasNext = data?.hasNext ?? false
          this.hasPrevious = data?.hasPrevious ?? false
          this.loading = false
        },
        error: () => {
          this.rows = []
          this.loading = false
        },
      })
  }

  onSideFilterApplied(filters: ListSubscriptionsQuery): void {
    this.currentFilters = filters ?? {}
    this.currentPage = 1
    this.loadData()
  }

  onSideFilterCleared(): void {
    this.currentFilters = {}
    this.currentPage = 1
    this.loadData()
  }

  goToPage(page: number): void {
    if (page < 1 || (this.totalPages && page > this.totalPages)) {
      return
    }
    this.currentPage = page
    this.loadData()
  }

  openManage(row: AdminSubscriptionRow): void {
    const modalRef = this.modalService.open(ManageSubscriptionModalComponent, {
      size: 'lg',
      centered: true,
    })
    modalRef.componentInstance.row = row
    modalRef.componentInstance.plans = this.plans
    modalRef.result.then(
      (result) => {
        if (result === 'updated') {
          this.loadData()
        }
        if (result === 'cancel') {
          this.onCancel(row)
        }
        if (result === 'reactivate') {
          this.onReactivate(row)
        }
        if (result === 'deactivate') {
          this.onSetCompanyActive(row, false)
        }
        if (result === 'activate') {
          this.onSetCompanyActive(row, true)
        }
      },
      () => {}
    )
  }

  isCompanyActive(row: AdminSubscriptionRow): boolean {
    return row.company.isActive !== false
  }

  // Borrado en CASCADA (solo superadmin): elimina la empresa y TODOS sus datos
  // (rol, usuario, sucursal, suscripción, etc.). Pide escribir el nombre exacto
  // para evitar borrados accidentales. Útil para resetear pruebas de la landing.
  onDeleteCompany(row: AdminSubscriptionRow): void {
    const name = row.company.name
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      icon: 'warning',
      title: this.translate.instant('SUBSCRIPTION_ADMIN.CONFIRM_DELETE_TITLE'),
      html: this.translate.instant('SUBSCRIPTION_ADMIN.CONFIRM_DELETE_TEXT', {
        company: name,
      }),
      input: 'text',
      inputPlaceholder: name,
      inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      confirmButtonText: this.translate.instant(
        'SUBSCRIPTION_ADMIN.DELETE_COMPANY_YES'
      ),
      cancelButtonText: this.translate.instant('WORDS.CANCEL'),
      preConfirm: (value: string) => {
        if ((value || '').trim() !== name) {
          Swal.showValidationMessage(
            this.translate.instant('SUBSCRIPTION_ADMIN.DELETE_NAME_MISMATCH')
          )
          return false
        }
        return true
      },
    }).then((result) => {
      if (!result.isConfirmed) {
        return
      }
      this.subscriptionAdminService
        .deleteCompanyCascade(row.company.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadData()
            Swal.fire({
              ...SWAL_SUCCESS_CONFIG,
              title: this.translate.instant('SUBSCRIPTION_ADMIN.COMPANY_DELETED'),
            })
          },
          error: () => {
            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: this.translate.instant('SUBSCRIPTION_ADMIN.ERROR'),
            })
          },
        })
    })
  }

  // Activar/desactivar la EMPRESA (bloquea/permite el login de sus usuarios).
  // Es distinto de cancelar la suscripción: aquí no se toca el cobro.
  onSetCompanyActive(row: AdminSubscriptionRow, isActive: boolean): void {
    Swal.fire({
      ...(isActive ? {} : SWAL_DELETE_CONFIRM_CONFIG),
      icon: isActive ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isActive ? '#198754' : '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      title: this.translate.instant(
        isActive
          ? 'SUBSCRIPTION_ADMIN.CONFIRM_ACTIVATE_COMPANY_TITLE'
          : 'SUBSCRIPTION_ADMIN.CONFIRM_DEACTIVATE_COMPANY_TITLE'
      ),
      text: this.translate.instant(
        isActive
          ? 'SUBSCRIPTION_ADMIN.CONFIRM_ACTIVATE_COMPANY_TEXT'
          : 'SUBSCRIPTION_ADMIN.CONFIRM_DEACTIVATE_COMPANY_TEXT',
        { company: row.company.name }
      ),
      confirmButtonText: this.translate.instant(
        isActive
          ? 'SUBSCRIPTION_ADMIN.ACTIVATE_COMPANY_YES'
          : 'SUBSCRIPTION_ADMIN.DEACTIVATE_COMPANY_YES'
      ),
      cancelButtonText: this.translate.instant('WORDS.CANCEL'),
    }).then((result) => {
      if (!result.isConfirmed) {
        return
      }
      this.subscriptionAdminService
        .setCompanyActive(row.company.id, isActive)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadData()
            Swal.fire({
              ...SWAL_SUCCESS_CONFIG,
              title: this.translate.instant(
                isActive
                  ? 'SUBSCRIPTION_ADMIN.COMPANY_ACTIVATED'
                  : 'SUBSCRIPTION_ADMIN.COMPANY_DEACTIVATED'
              ),
            })
          },
          error: () => {
            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: this.translate.instant('SUBSCRIPTION_ADMIN.ERROR'),
            })
          },
        })
    })
  }

  onCancel(row: AdminSubscriptionRow): void {
    if (!row.subscription) {
      return
    }
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: this.translate.instant('SUBSCRIPTION_ADMIN.CONFIRM_CANCEL_TITLE'),
      text: this.translate.instant('SUBSCRIPTION_ADMIN.CONFIRM_CANCEL_TEXT', {
        company: row.company.name,
      }),
      confirmButtonText: this.translate.instant('SUBSCRIPTION_ADMIN.CANCEL_YES'),
      cancelButtonText: this.translate.instant('WORDS.CANCEL'),
    }).then((result) => {
      if (!result.isConfirmed) {
        return
      }
      this.subscriptionAdminService
        .cancel(row.company.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.loadData()
            if (response.data?.billingNotified === false) {
              Swal.fire({
                ...SWAL_ERROR_CONFIG,
                icon: 'warning',
                title: this.translate.instant('SUBSCRIPTION_ADMIN.CANCELED'),
                text: this.translate.instant(
                  'SUBSCRIPTION_ADMIN.BILLING_NOT_NOTIFIED'
                ),
              })
            } else {
              Swal.fire({
                ...SWAL_SUCCESS_CONFIG,
                title: this.translate.instant('SUBSCRIPTION_ADMIN.CANCELED'),
              })
            }
          },
          error: () => {
            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: this.translate.instant('SUBSCRIPTION_ADMIN.ERROR'),
            })
          },
        })
    })
  }

  onReactivate(row: AdminSubscriptionRow): void {
    if (!row.subscription) {
      return
    }
    const isLanding = row.subscription.source === 'landing'
    Swal.fire({
      icon: isLanding ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      title: this.translate.instant('SUBSCRIPTION_ADMIN.CONFIRM_REACTIVATE_TITLE'),
      text: this.translate.instant(
        isLanding
          ? 'SUBSCRIPTION_ADMIN.CONFIRM_REACTIVATE_LANDING_TEXT'
          : 'SUBSCRIPTION_ADMIN.CONFIRM_REACTIVATE_TEXT',
        { company: row.company.name }
      ),
      confirmButtonText: this.translate.instant(
        'SUBSCRIPTION_ADMIN.REACTIVATE_YES'
      ),
      cancelButtonText: this.translate.instant('WORDS.CANCEL'),
    }).then((result) => {
      if (!result.isConfirmed) {
        return
      }
      this.subscriptionAdminService
        .reactivate(row.company.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadData()
            Swal.fire({
              ...SWAL_SUCCESS_CONFIG,
              title: this.translate.instant('SUBSCRIPTION_ADMIN.REACTIVATED'),
            })
          },
          error: () => {
            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: this.translate.instant('SUBSCRIPTION_ADMIN.ERROR'),
            })
          },
        })
    })
  }

  isCanceled(row: AdminSubscriptionRow): boolean {
    const status = row.subscription?.status
    return status === 'canceled' || status === 'cancelled'
  }

  // Indicador de vencimiento (sobre todo para las manuales por transferencia): 'soon'
  // si vence en <=7 días, 'expired' si ya pasó. No desactiva nada — es solo aviso
  // visual para cobrar/renovar a tiempo. No aplica a las canceladas.
  expiryState(row: AdminSubscriptionRow): 'expired' | 'soon' | null {
    if (!row.subscription || this.isCanceled(row)) {
      return null
    }
    const end = row.subscription.currentPeriodEnd
    if (!end) {
      return null
    }
    const endDate = new Date(end)
    if (isNaN(endDate.getTime())) {
      return null
    }
    const diffMs = endDate.getTime() - Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    if (diffMs < 0) {
      return 'expired'
    }
    if (diffMs <= 7 * dayMs) {
      return 'soon'
    }
    return null
  }

  logoUrl(row: AdminSubscriptionRow): string | null {
    const path = row.company.logoFile?.path
    return path ? `${environment.fileBaseUrl}/${path}` : null
  }

  statusBadgeClass(status: string | undefined): string {
    switch (status) {
      case 'active':
        return 'bg-success'
      case 'past_due':
        return 'bg-warning text-dark'
      case 'canceled':
      case 'cancelled':
        return 'bg-danger'
      case 'paused':
        return 'bg-secondary'
      default:
        return 'bg-light text-dark border'
    }
  }

  statusLabelKey(status: string | undefined): string {
    switch (status) {
      case 'active':
        return 'SUBSCRIPTION.STATUS_ACTIVE'
      case 'past_due':
        return 'SUBSCRIPTION.STATUS_PAST_DUE'
      case 'canceled':
      case 'cancelled':
        return 'SUBSCRIPTION.STATUS_CANCELED'
      case 'paused':
        return 'SUBSCRIPTION.STATUS_PAUSED'
      default:
        return 'SUBSCRIPTION_ADMIN.STATUS_NONE'
    }
  }
}
