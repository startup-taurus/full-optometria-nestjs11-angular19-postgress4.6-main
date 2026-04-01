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
import {
  LaboratoryOrder,
  LaboratoryOrderStatus,
} from '@core/interfaces/api/laboratory-order.interface'
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

  public getStatusClass(order: LaboratoryOrder): string {
    switch (this.normalizeStatus(order)) {
      case LaboratoryOrderStatus.SENT:
        return 'bg-info'
      case LaboratoryOrderStatus.RECEIVED:
        return 'bg-success'
      case LaboratoryOrderStatus.DELIVERED:
        return 'bg-primary'
      default:
        return 'bg-warning'
    }
  }

  public getStatusText(order: LaboratoryOrder): string {
    switch (this.normalizeStatus(order)) {
      case LaboratoryOrderStatus.SENT:
        return 'LABORATORY_ORDERS_MODULE.SENT'
      case LaboratoryOrderStatus.RECEIVED:
        return 'LABORATORY_ORDERS_MODULE.RECEIVED'
      case LaboratoryOrderStatus.DELIVERED:
        return 'LABORATORY_ORDERS_MODULE.DELIVERED'
      default:
        return 'LABORATORY_ORDERS_MODULE.PENDING'
    }
  }

  public getStatusActionClass(order: LaboratoryOrder): string {
    switch (this.normalizeStatus(order)) {
      case LaboratoryOrderStatus.SENT:
        return 'status-action--sent'
      case LaboratoryOrderStatus.RECEIVED:
        return 'status-action--received'
      case LaboratoryOrderStatus.DELIVERED:
        return 'status-action--delivered'
      default:
        return 'status-action--pending'
    }
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
        keyboard: true,
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
    const currentStatus = this.normalizeStatus(order)
    const statusOptions = this.getStatusOptions()

    Swal.fire({
      title: this._translateService.instant(
        'LABORATORY_ORDERS.MESSAGES.STATUS_CHANGE_CONFIRM'
      ),
      input: 'select',
      inputOptions: statusOptions,
      inputValue: currentStatus,
      inputPlaceholder: this._translateService.instant(
        'LABORATORY_ORDERS.MESSAGES.STATUS_SELECT_PLACEHOLDER'
      ),
      text: this._translateService.instant(
        'LABORATORY_ORDERS.MESSAGES.STATUS_CHANGE_TEXT'
      ),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      confirmButtonText: this._translateService.instant('SWEET_ALERT.CONFIRM'),
      cancelButtonText: this._translateService.instant('SWEET_ALERT.CANCEL'),
      customClass: {
        popup: 'status-change-modal',
        htmlContainer: 'status-modal-content',
        input: 'status-modal-select',
      },
      preConfirm: (value) => {
        if (!value) {
          Swal.showValidationMessage(
            this._translateService.instant(
              'LABORATORY_ORDERS.MESSAGES.STATUS_SELECT_REQUIRED'
            )
          )
          return false
        }

        return value
      },
      didOpen: () => {
        const confirmButton = Swal.getConfirmButton()
        if (confirmButton) {
          confirmButton.disabled = false
        }
      },
      allowOutsideClick: () => false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newStatus = result.value as LaboratoryOrderStatus

        if (newStatus === currentStatus) {
          return
        }

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
                html: error.error?.message?.es || error.error?.message || this._translateService.instant(
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
      keyboard: true,
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
    const formatProduct = (product: {
      code?: string
      name?: string
      quantity?: number
    }) => {
      const code = product.code ? `${product.code} - ` : ''
      const name = product.name || '-'
      const quantity = Number(product.quantity || 0)
      const qtyLabel = quantity > 0 ? ` x${quantity}` : ''
      return `${code}${name}${qtyLabel}`
    }

    const lineItems = order.lineItems || []
    if (lineItems.length > 0) {
      return lineItems
        .map((lineItem) =>
          formatProduct({
            code: lineItem.product?.code,
            name: lineItem.product?.name,
            quantity: lineItem.quantity,
          })
        )
        .join(', ')
    }

    const products = order.products || []

    if (products.length > 0) {
      return products
        .map((product) =>
          formatProduct({
            code: product.code,
            name: product.name,
          })
        )
        .join(', ')
    }

    if (order.product) {
      return formatProduct({
        code: order.product.code,
        name: order.product.name,
      })
    }

    return '-'
  }

  private normalizeStatus(order: LaboratoryOrder): LaboratoryOrderStatus {
    if (order.status) {
      return order.status
    }

    return order.isConfirmed
      ? LaboratoryOrderStatus.RECEIVED
      : LaboratoryOrderStatus.PENDING
  }

  private getStatusOptions(): Record<string, string> {
    return {
      [LaboratoryOrderStatus.PENDING]: this._translateService.instant(
        'LABORATORY_ORDERS_MODULE.PENDING'
      ),
      [LaboratoryOrderStatus.SENT]: this._translateService.instant(
        'LABORATORY_ORDERS_MODULE.SENT'
      ),
      [LaboratoryOrderStatus.RECEIVED]: this._translateService.instant(
        'LABORATORY_ORDERS_MODULE.RECEIVED'
      ),
      [LaboratoryOrderStatus.DELIVERED]: this._translateService.instant(
        'LABORATORY_ORDERS_MODULE.DELIVERED'
      ),
    }
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
