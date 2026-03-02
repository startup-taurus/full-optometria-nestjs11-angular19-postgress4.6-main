import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { PageTitleComponent } from '../../../../shared/components/layouts/page-title/page-title.component'
import { SideFilterPanelComponent } from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { InfiniteScrollDirective } from '../../../../shared/directives/infinite-scroll.directive'
import { FilterLaboratoryOrdersComponent } from '../filters/filter-laboratory-orders.component'
import { LaboratoryOrdersService } from '@core/services/api/laboratory-orders.service'
import { BranchService } from '@core/services/api/branch.service'
import { LaboratoryOrderPdfService } from '@core/services/ui/laboratory-order-pdf.service'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { LaboratoryOrder } from '@core/interfaces/api/laboratory-order.interface'
import { LaboratoryOrderPdfData } from '@core/interfaces/ui/laboratory-order-pdf.interface'
import { Branch } from '@core/interfaces/api/branch.interface'
import { LaboratoryOrderUpsertModalComponent } from '../laboratory-order-upsert-modal/laboratory-order-upsert-modal.component'
import { ViewLaboratoryOrderComponent } from '../forms/view-laboratory-order/view-laboratory-order.component'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { selectSelectedBranchId } from '@core/states/branch/branch.selectors'
import {
  firstValueFrom,
  Subject,
  takeUntil,
  distinctUntilChanged,
  debounceTime,
} from 'rxjs'
import Swal from 'sweetalert2'
import {
  SWAL_DELETE_CONFIRM_CONFIG,
  SWAL_SUCCESS_CONFIG,
  SWAL_ERROR_CONFIG,
} from '@core/helpers/ui/ui.constants'

@Component({
  selector: 'table-laboratory-orders',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PageTitleComponent,
    NgbModule,
    SideFilterPanelComponent,
    InfiniteScrollDirective,
  ],
  templateUrl: './table-laboratory-orders.component.html',
  styleUrl: './table-laboratory-orders.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableLaboratoryOrdersComponent implements OnInit, OnDestroy {
  private _laboratoryOrdersService = inject(LaboratoryOrdersService)
  private _branchService = inject(BranchService)
  private _pdfService = inject(LaboratoryOrderPdfService)
  private _modalService = inject(NgbModal)
  private _translateService = inject(TranslateService)
  private _filterCommunicationService = inject(FilterCommunicationService)
  private _store = inject(Store<AppState>)

  public laboratoryOrders: LaboratoryOrder[] = []
  public filteredOrders: LaboratoryOrder[] = []
  public sideFilterComponent = FilterLaboratoryOrdersComponent
  public isLoading = false
  public showFloatingMenu: string | null = null
  public currentPage = 1
  public totalItems = 0
  public hasMore = true
  private pageSize = 10
  private currentFilters: any = {}
  private unsubscribe$: Subject<boolean> = new Subject<boolean>()
  private isInitialLoad = true
  private currentBranchId: string | null = null

  @ViewChild('sideFilterPanel', { static: false })
  public sideFilterPanel?: SideFilterPanelComponent

  ngOnInit(): void {
    this.initializeSubscriptions()
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(true)
    this.unsubscribe$.unsubscribe()
  }

  private initializeSubscriptions(): void {
    this._store
      .select(selectSelectedBranchId)
      .pipe(
        takeUntil(this.unsubscribe$),
        distinctUntilChanged(),
        debounceTime(300)
      )
      .subscribe({
        next: (branchId) => {
          if (!branchId) {
            return
          }

          const shouldLoadInitial = this.isInitialLoad
          const branchChanged = this.currentBranchId !== branchId

          this.currentBranchId = branchId

          if (shouldLoadInitial || branchChanged) {
            this.resetAndLoad()
          }
        },
        error: (error) => {},
      })

    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged())
      .subscribe({
        next: (filter) => {
          if (!this.isInitialLoad) {
            this.currentFilters = filter || {}
            this.resetAndLoad()
          }
        },
        error: (err) => {},
      })
  }

  private resetAndLoad(): void {
    this.currentPage = 1
    this.laboratoryOrders = []
    this.filteredOrders = []
    this.hasMore = true
    this.loadLaboratoryOrders(this.currentFilters)
  }

  public reloadData(): void {
    this.resetAndLoad()
  }

  public onSideFilterApplied(filters: any): void {
    this.currentFilters = filters
    this.resetAndLoad()
  }

  public onSideFilterCleared(): void {
    this.currentFilters = {}
    this.resetAndLoad()
  }

  private loadLaboratoryOrders(filters: any = {}): void {
    if (this.isLoading || !this.hasMore) {
      return
    }

    this.isLoading = true

    const queryParams = {
      ...filters,
      page: this.currentPage,
      limit: this.pageSize,
    }

    this._laboratoryOrdersService.getAllWithFilters(queryParams).subscribe({
      next: (response: any) => {
        const items =
          response?.data?.result || response?.data || response?.items || []

        if (this.currentPage === 1) {
          this.laboratoryOrders = items
        } else {
          this.laboratoryOrders = [...this.laboratoryOrders, ...items]
        }

        this.filteredOrders = [...this.laboratoryOrders]
        this.totalItems = response?.total || 0
        this.hasMore = this.laboratoryOrders.length < this.totalItems

        this.isLoading = false
        this.isInitialLoad = false
      },
      error: (error: any) => {
        this.isLoading = false
        this.isInitialLoad = false
        this.hasMore = false
      },
    })
  }

  public onScrollEnd(): void {
    if (!this.isLoading && this.hasMore) {
      this.currentPage++
      this.loadLaboratoryOrders(this.currentFilters)
    }
  }

  public formatDate(date: string): string {
    if (!date) return '-'
    const [year, month, day] = date.split('-')
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  public getStatusClass(isConfirmed: boolean): string {
    return isConfirmed ? 'bg-success' : 'bg-warning'
  }

  public getStatusText(isConfirmed: boolean): string {
    return isConfirmed
      ? 'LABORATORY_ORDERS.STATUS_CONFIRMED'
      : 'LABORATORY_ORDERS.STATUS_PENDING'
  }

  public onViewClick(event: Event, order: LaboratoryOrder): void {
    event.stopPropagation()
    this.onView(order)
  }

  public onEditClick(event: Event, order: LaboratoryOrder): void {
    event.stopPropagation()
    this.onEdit(order)
  }

  public onDeleteClick(event: Event, order: LaboratoryOrder): void {
    event.stopPropagation()
    this.onDelete(order)
  }

  public onChangeStatusClick(event: Event, order: LaboratoryOrder): void {
    event.stopPropagation()
    this.onChangeStatus(order)
  }

  public onEdit(order: LaboratoryOrder): void {
    const modalRef = this._modalService.open(
      LaboratoryOrderUpsertModalComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
      }
    )

    modalRef.componentInstance.mode = 'edit'
    modalRef.componentInstance.orderId = order.id

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.resetAndLoad()
        }
      },
      () => {}
    )
  }

  public onDelete(order: LaboratoryOrder): void {
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: this._translateService.instant(
        'LABORATORY_ORDERS.MESSAGES.DELETE_CONFIRM'
      ),
      text: this._translateService.instant(
        'LABORATORY_ORDERS.MESSAGES.DELETE_TEXT'
      ),
      confirmButtonText: this._translateService.instant('SWEET_ALERT.CONFIRM'),
      cancelButtonText: this._translateService.instant('SWEET_ALERT.CANCEL'),
    }).then((result) => {
      if (result.isConfirmed) {
        this._laboratoryOrdersService.delete(order.id).subscribe({
          next: () => {
            Swal.fire({
              ...SWAL_SUCCESS_CONFIG,
              title: this._translateService.instant('COMMON.SUCCESS'),
              text: this._translateService.instant(
                'LABORATORY_ORDERS.MESSAGES.DELETE_SUCCESS'
              ),
            })
            this.resetAndLoad()
          },
          error: (error: any) => {
            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: this._translateService.instant('COMMON.ERROR'),
              text: this._translateService.instant(
                'LABORATORY_ORDERS.MESSAGES.DELETE_ERROR'
              ),
            })
          },
        })
      }
    })
  }

  public onChangeStatus(order: LaboratoryOrder): void {
    const newStatus = !order.isConfirmed
    const statusText = newStatus
      ? this._translateService.instant('LABORATORY_ORDERS.MESSAGES.CONFIRMED')
      : this._translateService.instant(
          'LABORATORY_ORDERS.MESSAGES.PENDING_STATUS'
        )

    Swal.fire({
      title: this._translateService.instant(
        'LABORATORY_ORDERS.MESSAGES.STATUS_CHANGE_CONFIRM'
      ),
      text: `${this._translateService.instant('LABORATORY_ORDERS.MESSAGES.STATUS_CHANGE_TEXT')} ${statusText}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: this._translateService.instant('SWEET_ALERT.CONFIRM'),
      cancelButtonText: this._translateService.instant('SWEET_ALERT.CANCEL'),
    }).then((result) => {
      if (result.isConfirmed) {
        this._laboratoryOrdersService
          .changeStatus(order.id, newStatus)
          .subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: this._translateService.instant('COMMON.SUCCESS'),
                text: this._translateService.instant(
                  'LABORATORY_ORDERS.MESSAGES.STATUS_CHANGE_SUCCESS'
                ),
                timer: 2000,
                showConfirmButton: false,
              })
              this.resetAndLoad()
            },
            error: (error: any) => {
              Swal.fire({
                icon: 'error',
                title: this._translateService.instant('COMMON.ERROR'),
                text: this._translateService.instant(
                  'LABORATORY_ORDERS.MESSAGES.STATUS_CHANGE_ERROR'
                ),
              })
            },
          })
      }
    })
  }

  public onView(order: LaboratoryOrder): void {
    const modalRef = this._modalService.open(ViewLaboratoryOrderComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    })

    modalRef.componentInstance.orderId = order.id
  }

  trackByOrderId(index: number, order: LaboratoryOrder): string {
    return order.id
  }

  public toggleFloatingMenu(orderId: string): void {
    this.showFloatingMenu = this.showFloatingMenu === orderId ? null : orderId
  }

  hasPhoneNumber(order: LaboratoryOrder): boolean {
    return !!(order.patient?.mobilePhone || order.patient?.homePhone)
  }

  hasEmail(order: LaboratoryOrder): boolean {
    return !!order.patient?.email
  }

  public getOrderProductsText(order: LaboratoryOrder): string {
    const products = order.products || []

    if (products.length > 0) {
      return products.map((product) => product.name).join(', ')
    }

    return order.product?.name || order.frameModel || '-'
  }

  public onSendWhatsApp(order: LaboratoryOrder): void {
    const phone = order.patient?.mobilePhone || order.patient?.homePhone

    if (!phone) {
      Swal.fire({
        icon: 'warning',
        title: this._translateService.instant('COMMON.WARNING'),
        text: this._translateService.instant(
          'LABORATORY_ORDERS.MESSAGES.NO_PHONE'
        ),
      })
      return
    }

    const formattedPhone = this.formatPhoneForWhatsApp(phone)

    const patientName =
      `${order.patient?.firstName || ''} ${order.patient?.lastName || ''}`.trim()
    const orderDate = this.formatDate(order.attendanceDate)
    const productName = this.getOrderProductsText(order)

    const message = `Hola ${patientName}, tu orden de laboratorio para ${productName} con fecha ${orderDate} está lista. ¡Gracias!`
    const encodedMessage = encodeURIComponent(message)

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`

    try {
      window.open(whatsappUrl, '_blank')
    } catch (error) {}

    this.showFloatingMenu = null
  }

  private formatPhoneForWhatsApp(phone: string): string {
    let cleanPhone = phone.replace(/\D/g, '')

    if (!cleanPhone.startsWith('593') && cleanPhone.length <= 10) {
      cleanPhone = '593' + cleanPhone
    }

    return cleanPhone
  }

  public onSendEmail(order: LaboratoryOrder): void {
    if (!order.patient?.email) {
      Swal.fire({
        icon: 'warning',
        title: this._translateService.instant('COMMON.WARNING'),
        text: this._translateService.instant(
          'LABORATORY_ORDERS.MESSAGES.NO_EMAIL'
        ),
      })
      return
    }

    const patientName =
      `${order.patient?.firstName || ''} ${order.patient?.lastName || ''}`.trim()
    const orderDate = this.formatDate(order.attendanceDate)
    const productName = this.getOrderProductsText(order)

    const subject = encodeURIComponent('Orden de Laboratorio Lista')
    const body = encodeURIComponent(
      `Estimado/a ${patientName},\n\nTu orden de laboratorio para ${productName} con fecha ${orderDate} está lista.\n\nSaludos cordiales.`
    )

    const mailtoUrl = `mailto:${order.patient.email}?subject=${subject}&body=${body}`

    try {
      window.location.href = mailtoUrl
    } catch (error) {}

    this.showFloatingMenu = null
  }

  public async onPrintOrder(order: LaboratoryOrder): Promise<void> {
    try {
      const branchState = await firstValueFrom(
        this._branchService.getBranchFilterState()
      )

      const branchId = branchState.selectedBranchId || order.branchId

      if (!branchId) {
        throw new Error('No se pudo obtener el ID de la sucursal')
      }

      const currentBranch = await firstValueFrom(
        this._branchService.getBranchById(branchId)
      )

      if (!currentBranch) {
        throw new Error('No se pudo obtener la información de la sucursal')
      }

      const orderNumber = this.formatOrderNumber(order.orderNumber || 0)

      const pdfData: LaboratoryOrderPdfData = {
        order: order,
        branch: currentBranch,
        orderNumber: orderNumber,
      }

      await this._pdfService.generatePdf(pdfData)

      this.showFloatingMenu = null
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: this._translateService.instant('COMMON.ERROR'),
        text: this._translateService.instant(
          'LABORATORY_ORDERS.MESSAGES.PRINT_ERROR'
        ),
      })
    }
  }

  private formatOrderNumber(orderNumber: number): string {
    return orderNumber.toString().padStart(9, '0')
  }
}
