import { CommonModule } from '@angular/common'
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
} from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgbModule, NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap'
import { ToastrService } from 'ngx-toastr'
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs'
import { PageTitleComponent } from '../../../../shared/components/layouts/page-title/page-title.component'
import { SideFilterPanelComponent } from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { InfiniteScrollDirective } from '../../../../shared/directives/infinite-scroll.directive'
import { FilterBranchesComponent } from '../filters/filter-branches.component'
import { BranchModalComponent } from '../modals/branch-modal/branch-modal.component'
import { ViewBranchModalComponent } from '../modals/view-branch-modal/view-branch-modal.component'
import { ChangeStatusBranchModalComponent } from '../modals/change-status-branch-modal/change-status-branch-modal.component'
import { BranchesService } from '@core/services/api/branches.service'
import { AuthenticationService } from '@core/services/api/auth.service'
import { Branch, QueryBranchDto } from '@core/interfaces/api/branch.interface'
import { PlanQuota } from '@core/interfaces/api/company.interface'
import Swal from 'sweetalert2'
import {
  SWAL_DELETE_CONFIRM_CONFIG,
  SWAL_SUCCESS_CONFIG,
  SWAL_ERROR_CONFIG,
} from '@core/helpers/ui/ui.constants'
import { formatBranchScheduleForDisplay } from '@core/helpers/branch-schedule.helper'

@Component({
  selector: 'table-branches',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PageTitleComponent,
    NgbModule,
    SideFilterPanelComponent,
    InfiniteScrollDirective,
  ],
  templateUrl: './table-branches.component.html',
  styleUrl: './table-branches.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableBranchesComponent implements OnInit, OnDestroy {
  public branches: Branch[] = []
  public loading = false
  public showFloatingMenu: string | null = null
  public sideFilterComponent = FilterBranchesComponent
  public currentPage = 1
  public totalItems = 0
  public hasMore = true
  public pageSize = 10
  public quota: PlanQuota | null = null

  private destroy$ = new Subject<void>()
  private currentFilters: QueryBranchDto = {}
  private branchesService = inject(BranchesService)
  private authService = inject(AuthenticationService)
  private modalService = inject(NgbModal)
  private toastr = inject(ToastrService)
  private translateService = inject(TranslateService)

  @ViewChild('sideFilterPanel', { static: false })
  public sideFilterPanel?: SideFilterPanelComponent

  constructor(config: NgbModalConfig) {
    config.backdrop = 'static'
    config.keyboard = false
  }

  ngOnInit(): void {
    this.loadBranches()
    this.loadQuota()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  public formatOpeningHours(openingHours?: string): string {
    return formatBranchScheduleForDisplay(openingHours, {
      dayLabelResolver: (day) => this.getDayLabel(day),
      closedLabel: this.translateService.instant('WORDS.CLOSED'),
    })
  }

  private getDayLabel(day: number): string {
    const weekDay = [
      'WORDS.SUNDAY',
      'WORDS.MONDAY',
      'WORDS.TUESDAY',
      'WORDS.WEDNESDAY',
      'WORDS.THURSDAY',
      'WORDS.FRIDAY',
      'WORDS.SATURDAY',
    ][day]

    return this.translateService.instant(weekDay)
  }

  private loadQuota(): void {
    this.authService.getMyQuota()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => { this.quota = res.data ?? null },
        error: (err) => { console.error('[Branches] quota error:', err) },
      })
  }

  public refreshQuota(): void {
    this.authService.getMyQuota()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => { this.quota = res.data ?? null },
        error: () => {},
      })
  }

  public getBranchesUsed(): number {
    return this.quota?.branchesCount ?? 0
  }

  public getBranchesLimit(): number | null {
    return this.quota?.maxBranches ?? null
  }

  public getBranchesLimitLabel(): string {
    const limit = this.getBranchesLimit()
    return limit === null ? '∞' : String(limit)
  }

  public getBranchesUsagePercent(): number {
    const limit = this.getBranchesLimit()
    if (!limit || limit <= 0) {
      return 0
    }

    return Math.min(100, Math.round((this.getBranchesUsed() / limit) * 100))
  }

  public getBranchesRemainingLabel(): string {
    const limit = this.getBranchesLimit()
    if (limit === null) {
      return 'Sin límite'
    }

    return `${Math.max(limit - this.getBranchesUsed(), 0)} libres`
  }

  public getBranchesBadgeClass(): string {
    const limit = this.getBranchesLimit()
    if (limit === null) {
      return 'bg-primary'
    }

    return this.getBranchesUsed() >= limit ? 'bg-danger' : 'bg-success'
  }

  public getBranchesProgressClass(): string {
    const limit = this.getBranchesLimit()
    if (limit === null) {
      return 'bg-primary'
    }

    return this.getBranchesUsed() >= limit ? 'bg-danger' : 'bg-success'
  }

  public getBranchesQuotaTooltip(): string {
    const limit = this.getBranchesLimit()
    if (limit === null) {
      return `Tienes ${this.getBranchesUsed()} sucursales registradas. Tu plan no tiene límite de sucursales.`
    }

    const remaining = Math.max(limit - this.getBranchesUsed(), 0)
    if (remaining === 0) {
      return `Has usado ${this.getBranchesUsed()} de ${limit} sucursales. Ya llegaste al límite y debes ampliar tu plan para crear más.`
    }

    return `Has usado ${this.getBranchesUsed()} de ${limit} sucursales. Te quedan ${remaining} disponibles para crear.`
  }

  private loadBranches(filters: QueryBranchDto = {}): void {
    if (this.loading || !this.hasMore) {
      return
    }

    this.loading = true

    const queryParams: QueryBranchDto = {
      page: this.currentPage,
      limit: this.pageSize,
      ...filters,
    }

    this.branchesService
      .findBranches(queryParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data && response.data.result) {
            const newBranches = response.data.result || []

            if (this.currentPage === 1) {
              this.branches = newBranches
            } else {
              this.branches = [...this.branches, ...newBranches]
            }

            this.totalItems = response.data.totalCount || 0
            this.hasMore = this.branches.length < this.totalItems

            console.log('[Branches] Loaded:', {
              page: this.currentPage,
              loaded: newBranches.length,
              total: this.totalItems,
              hasMore: this.hasMore,
            })
          } else {
            if (this.currentPage === 1) {
              this.branches = []
            }
            this.totalItems = 0
            this.hasMore = false
          }

          this.loading = false
        },
        error: (error) => {
          console.error('[Branches] Error loading:', error)
          if (this.currentPage === 1) {
            this.branches = []
          }
          this.totalItems = 0
          this.hasMore = false
          this.loading = false
        },
      })
  }

  private resetAndLoad(): void {
    this.currentPage = 1
    this.branches = []
    this.hasMore = true
    this.loadBranches(this.currentFilters)
  }

  public reloadData(): void {
    this.resetAndLoad()
    this.refreshQuota()
  }

  public onSideFilterApplied(filters: QueryBranchDto): void {
    this.currentFilters = filters
    this.resetAndLoad()
  }

  public onSideFilterCleared(): void {
    this.currentFilters = {}
    this.resetAndLoad()
  }

  public onScrollEnd(): void {
    if (!this.loading && this.hasMore) {
      this.currentPage++
      this.loadBranches(this.currentFilters)
    }
  }

  public onNewBranch(): void {
    const modalRef = this.modalService.open(BranchModalComponent, {
      size: 'lg',
      centered: true,
    })
    modalRef.componentInstance.editMode = false

    modalRef.result.then(
      (result) => {
        if (result === 'created') {
          this.reloadData()
        }
      },
      () => {}
    )
  }

  public onViewBranch(branch: Branch): void {
    this.showFloatingMenu = null
    const modalRef = this.modalService.open(ViewBranchModalComponent, {
      size: 'lg',
      centered: true,
    })
    modalRef.componentInstance.selectedBranch = branch
  }

  public onEditBranch(branch: Branch): void {
    this.showFloatingMenu = null
    const modalRef = this.modalService.open(BranchModalComponent, {
      size: 'lg',
      centered: true,
    })
    modalRef.componentInstance.editMode = true
    modalRef.componentInstance.selectedBranch = branch

    modalRef.result.then(
      (result) => {
        if (result === 'updated') {
          this.reloadData()
        }
      },
      () => {}
    )
  }

  public onToggleStatus(branch: Branch): void {
    this.showFloatingMenu = null
    const modalRef = this.modalService.open(ChangeStatusBranchModalComponent, {
      size: 'md',
      centered: true,
    })
    modalRef.componentInstance.selectedBranch = branch

    modalRef.result.then(
      (result) => {
        if (result === 'updated') {
          this.reloadData()
        }
      },
      () => {}
    )
  }

  public onDeleteBranch(branch: Branch): void {
    this.showFloatingMenu = null
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: '¿Está seguro?',
      text: `¿Desea eliminar la sucursal "${branch.name}"?`,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.branchesService
          .deleteBranch(branch.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.reloadData()
              Swal.fire({
                ...SWAL_SUCCESS_CONFIG,
                title: '¡Eliminado!',
                text: 'La sucursal ha sido eliminada.',
              })
            },
            error: (error) => {
              Swal.fire({
                ...SWAL_ERROR_CONFIG,
                title: 'Error',
                text: 'No se pudo eliminar la sucursal.',
              })
            },
          })
      }
    })
  }

  public getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'bg-success' : 'bg-danger'
  }

  public getStatusText(isActive: boolean): string {
    return isActive ? 'WORDS.ACTIVE' : 'WORDS.INACTIVE'
  }

  public toggleFloatingMenu(branchId: string): void {
    this.showFloatingMenu = this.showFloatingMenu === branchId ? null : branchId
  }

  public onSendWhatsApp(branch: Branch): void {
    this.showFloatingMenu = null
    if (branch.phone) {
      const formattedPhone = this.formatPhoneForWhatsApp(branch.phone)

      const message = `Hola, me gustaría obtener información sobre la sucursal ${branch.name}.`
      const encodedMessage = encodeURIComponent(message)

      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`

      try {
        window.open(whatsappUrl, '_blank')
      } catch (error) {
        this.toastr.error('Error al abrir WhatsApp', 'Error')
      }
    } else {
      this.toastr.warning(
        'Esta sucursal no tiene número de teléfono registrado',
        'Sin teléfono'
      )
    }
  }

  private formatPhoneForWhatsApp(phone: string): string {
    let cleanPhone = phone.replace(/\D/g, '')

    if (!cleanPhone.startsWith('593') && cleanPhone.length <= 10) {
      cleanPhone = '593' + cleanPhone
    }

    return cleanPhone
  }

  public onSendEmail(branch: Branch): void {
    this.showFloatingMenu = null
    if (branch.corporateEmail) {
      const subject = encodeURIComponent(`Consulta - Sucursal ${branch.name}`)
      const mailtoUrl = `mailto:${branch.corporateEmail}?subject=${subject}`
      window.location.href = mailtoUrl
    } else {
      this.toastr.warning(
        'Esta sucursal no tiene correo corporativo registrado',
        'Sin correo'
      )
    }
  }

  public onPrintBranch(branch: Branch): void {
    this.showFloatingMenu = null

    const printWindow = window.open('', '_blank', 'width=800,height=600')

    if (printWindow) {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sucursal - ${branch.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              line-height: 1.6;
            }
            h1 {
              color: #333;
              border-bottom: 2px solid #007bff;
              padding-bottom: 10px;
            }
            .info-section {
              margin: 20px 0;
            }
            .info-section h2 {
              color: #555;
              font-size: 18px;
              margin-bottom: 10px;
            }
            .info-row {
              display: flex;
              margin: 8px 0;
            }
            .info-label {
              font-weight: bold;
              width: 200px;
              color: #666;
            }
            .info-value {
              color: #333;
            }
            .status-badge {
              padding: 4px 12px;
              border-radius: 4px;
              color: white;
              display: inline-block;
            }
            .status-active {
              background-color: #28a745;
            }
            .status-inactive {
              background-color: #dc3545;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <h1>Información de Sucursal</h1>
          
          <div class="info-section">
            <h2>Información General</h2>
            <div class="info-row">
              <div class="info-label">Nombre:</div>
              <div class="info-value">${branch.name || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Código:</div>
              <div class="info-value">${branch.code || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Estado:</div>
              <div class="info-value">
                <span class="status-badge ${branch.isActive ? 'status-active' : 'status-inactive'}">
                  ${branch.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h2>Información de Contacto</h2>
            <div class="info-row">
              <div class="info-label">Dirección:</div>
              <div class="info-value">${branch.address || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Ciudad:</div>
              <div class="info-value">${branch.city || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Teléfono:</div>
              <div class="info-value">${branch.phone || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Correo Corporativo:</div>
              <div class="info-value">${branch.corporateEmail || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Horario de Atención:</div>
              <div class="info-value">${this.formatOpeningHours(branch.openingHours)}</div>
            </div>
          </div>

          <div class="info-section">
            <h2>Fechas</h2>
            <div class="info-row">
              <div class="info-label">Fecha de Creación:</div>
              <div class="info-value">${branch.createdAt ? new Date(branch.createdAt).toLocaleString('es-ES') : 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Última Actualización:</div>
              <div class="info-value">${branch.updatedAt ? new Date(branch.updatedAt).toLocaleString('es-ES') : 'N/A'}</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              // Cerrar la ventana después de imprimir (opcional)
              // window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
        </html>
      `

      printWindow.document.write(printContent)
      printWindow.document.close()
    } else {
      this.toastr.error('No se pudo abrir la ventana de impresión', 'Error')
    }
  }
}
