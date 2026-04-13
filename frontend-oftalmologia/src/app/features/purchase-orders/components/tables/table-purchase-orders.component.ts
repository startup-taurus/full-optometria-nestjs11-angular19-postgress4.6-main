import { CommonModule } from '@angular/common'
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap'
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  map,
  Observable,
  of,
  Subject,
  takeUntil,
  tap,
} from 'rxjs'
import Swal from 'sweetalert2'
import { Store } from '@ngrx/store'

import { AppState } from '@core/states'
import { selectSelectedBranchId } from '@core/states/branch/branch.selectors'
import { PurchaseOrdersService } from '@core/services/api/purchase-orders.service'
import {
  PurchaseOrder,
  PurchaseOrderInvoiceState,
  BillingPaymentMethod,
  CreatePurchaseOrderInvoiceDto,
  PurchaseOrderQueryParams,
  PurchaseOrderStatus,
} from '@core/interfaces/api/purchase-order.interface'
import { NgxDatatableConfig } from '@core/interfaces/ui/ngx-datatable.interface'
import { DEFAULT_NGX_DATATABLE_PAGINATION } from '@core/helpers/ui/ngx-datatable.constant'
import {
  SWAL_DELETE_CONFIRM_CONFIG,
  SWAL_ERROR_CONFIG,
  SWAL_SUCCESS_CONFIG,
} from '@core/helpers/ui/ui.constants'

import { PageTitleComponent } from '../../../../shared/components/layouts/page-title/page-title.component'
import { NgxDatatableComponent } from '../../../../shared/components/tables/ngx-datatabale/ngx-datatable.component'
import {
  FilterValue,
  SideFilterPanelComponent,
} from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { FilterPurchaseOrdersComponent } from '../filters/filter-purchase-orders.component'
import { ViewPurchaseOrderModalComponent } from '../modals/view-purchase-order-modal/view-purchase-order-modal.component'
import { CreateEditPurchaseOrderModalComponent } from '../modals/create-edit-purchase-order-modal/create-edit-purchase-order-modal.component'
import { ViewLaboratoryOrderComponent } from '../../../laboratoy-orders/components/forms/view-laboratory-order/view-laboratory-order.component'
import { PurchaseOrdersSummaryComponent } from '../purchase-orders-summary/purchase-orders-summary.component'

@Component({
  selector: 'table-purchase-orders',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NgbModule,
    PageTitleComponent,
    PurchaseOrdersSummaryComponent,
    NgxDatatableComponent,
    SideFilterPanelComponent,
  ],
  templateUrl: './table-purchase-orders.component.html',
  styleUrl: './table-purchase-orders.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TablePurchaseOrdersComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  private pagination = DEFAULT_NGX_DATATABLE_PAGINATION

  public sideFilterComponent = FilterPurchaseOrdersComponent

  @ViewChild('orderNumberTemplate', { static: false })
  public orderNumberTemplate?: TemplateRef<HTMLElement>
  @ViewChild('clientTemplate', { static: false })
  public clientTemplate?: TemplateRef<HTMLElement>
  @ViewChild('statusTemplate', { static: false })
  public statusTemplate?: TemplateRef<HTMLElement>
  @ViewChild('invoiceTemplate', { static: false })
  public invoiceTemplate?: TemplateRef<HTMLElement>
  @ViewChild('priceTemplate', { static: false })
  public priceTemplate?: TemplateRef<HTMLElement>
  @ViewChild('labOrderTemplate', { static: false })
  public labOrderTemplate?: TemplateRef<HTMLElement>
  @ViewChild('createdAtTemplate', { static: false })
  public createdAtTemplate?: TemplateRef<HTMLElement>
  @ViewChild('actionsTemplate', { static: false })
  public actionsTemplate?: TemplateRef<HTMLElement>
  @ViewChild('sideFilterPanel', { static: false })
  public sideFilterPanel?: SideFilterPanelComponent

  public config$ = new BehaviorSubject<Partial<NgxDatatableConfig>>({})
  public data$: Observable<PurchaseOrder[]> = of([])

  public filter: Partial<PurchaseOrderQueryParams> = {}
  private unsubscribe$ = new Subject<void>()
  private hasInitializedBranchSubscription = false

  private purchaseOrdersService = inject(PurchaseOrdersService)
  private modalService = inject(NgbModal)
  private store = inject(Store<AppState>)
  private translateService = inject(TranslateService)

  ngOnInit(): void {
    this.subscribeToBranchChanges()
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.config$ = this.setConfigDatatable()
      this.reloadDatatable(this.filter)
    }, 0)
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  private subscribeToBranchChanges(): void {
    this.store
      .select(selectSelectedBranchId)
      .pipe(
        takeUntil(this.unsubscribe$),
        distinctUntilChanged(),
        debounceTime(300)
      )
      .subscribe(() => {
        if (!this.hasInitializedBranchSubscription) {
          this.hasInitializedBranchSubscription = true
          return
        }

        this.reloadDatatable(this.filter)
      })
  }

  public onSummaryFilterApplied(status: string): void {
    let newFilter: Partial<PurchaseOrderQueryParams> = {}

    if (status === 'pendingToInvoice') {
      // Mostrar órdenes pendientes que deben facturarse
      newFilter = {
        status: PurchaseOrderStatus.PENDING,
        shouldInvoice: true,
      }
    } else if (status === 'pending') {
      // Mostrar órdenes pendientes que NO deben facturarse aún
      newFilter = {
        status: PurchaseOrderStatus.PENDING,
        shouldInvoice: false,
      }
    } else if (status === 'invoiced') {
      newFilter = {
        status: PurchaseOrderStatus.INVOICED,
      }
    } else if (status === 'all') {
      newFilter = {}
    }

    this.reloadDatatable(newFilter)
  }

  private setConfigDatatable(): BehaviorSubject<Partial<NgxDatatableConfig>> {
    return new BehaviorSubject<Partial<NgxDatatableConfig>>({
      limit: this.pagination.LIMIT,
      page: this.pagination.PAGE,
      columns: [
        {
          name: 'PURCHASE_ORDERS.TABLE.ORDER',
          cellTemplate: this.orderNumberTemplate,
          width: 110,
          sortable: false,
        },
        {
          name: 'PURCHASE_ORDERS.TABLE.CLIENT',
          cellTemplate: this.clientTemplate,
          width: 230,
          sortable: false,
        },
        {
          name: 'PURCHASE_ORDERS.TABLE.LAB_ORDER',
          cellTemplate: this.labOrderTemplate,
          width: 120,
          sortable: false,
        },
        {
          name: 'PURCHASE_ORDERS.TABLE.STATUS',
          cellTemplate: this.statusTemplate,
          width: 130,
          sortable: false,
        },
        {
          name: 'PURCHASE_ORDERS.TABLE.INVOICE',
          cellTemplate: this.invoiceTemplate,
          width: 230,
          sortable: false,
        },
        {
          name: 'PURCHASE_ORDERS.TABLE.PRICE',
          cellTemplate: this.priceTemplate,
          width: 130,
          sortable: false,
        },
        {
          name: 'PURCHASE_ORDERS.TABLE.CREATED_AT',
          cellTemplate: this.createdAtTemplate,
          width: 170,
          sortable: false,
        },
        {
          name: 'PURCHASE_ORDERS.TABLE.ACTIONS',
          cellTemplate: this.actionsTemplate,
          width: 280,
          sortable: false,
        },
      ],
    })
  }

  private loadPurchaseOrdersObservable(): Observable<PurchaseOrder[]> {
    this.config$.next({ ...this.config$.value, loadingIndicator: true })

    const queryParams: PurchaseOrderQueryParams = {
      ...this.filter,
      limit: this.config$.value.limit,
      page: this.config$.value.page,
    }

    return this.purchaseOrdersService.getPaginated(queryParams).pipe(
      tap((response) => {
        this.config$.next({
          ...this.config$.value,
          loadingIndicator: false,
          count: response.total,
        })
      }),
      map((response) => response.data || []),
      catchError(() => {
        this.config$.next({ ...this.config$.value, loadingIndicator: false })
        return of([])
      })
    )
  }

  public reloadDatatable(filter: Partial<PurchaseOrderQueryParams> = {}): void {
    this.filter = filter
    this.config$.next({
      ...this.config$.value,
      limit: this.pagination.LIMIT,
      page: this.pagination.PAGE,
    })
    this.data$ = this.loadPurchaseOrdersObservable()
  }

  public onChangeLimit(limit: number): void {
    this.config$.next({
      ...this.config$.value,
      limit,
      page: this.pagination.PAGE,
    })
    this.data$ = this.loadPurchaseOrdersObservable()
  }

  public onChangePage(page: number): void {
    this.config$.next({ ...this.config$.value, page })
    this.data$ = this.loadPurchaseOrdersObservable()
  }

  public onSideFilterApplied(filters: FilterValue): void {
    this.reloadDatatable(filters as Partial<PurchaseOrderQueryParams>)
  }

  public onSideFilterCleared(): void {
    this.reloadDatatable({})
  }

  public openViewModal(order: PurchaseOrder): void {
    const modalRef = this.modalService.open(ViewPurchaseOrderModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    })

    modalRef.componentInstance.orderId = order.id
  }

  public openLinkedLaboratoryOrder(order: PurchaseOrder): void {
    const linkedOrderId = order?.laboratoryOrder?.id
    if (!linkedOrderId) {
      return
    }

    const modalRef = this.modalService.open(ViewLaboratoryOrderComponent, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    })

    modalRef.componentInstance.orderId = linkedOrderId
  }

  public openEditModal(order: PurchaseOrder): void {
    const modalRef = this.modalService.open(
      CreateEditPurchaseOrderModalComponent,
      {
        size: 'md',
        centered: true,
        backdrop: 'static',
      }
    )

    modalRef.componentInstance.purchaseOrder = order

    modalRef.result.then(
      (result) => {
        if (result === 'updated') {
          this.reloadDatatable(this.filter)
        }
      },
      () => {}
    )
  }

  public deleteOrder(order: PurchaseOrder): void {
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: '¿Está seguro?',
      text: `¿Desea cancelar la orden #${order.orderNumber || '-'}?`,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return
      }

      this.purchaseOrdersService
        .remove(order.id)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: () => {
            Swal.fire({
              ...SWAL_SUCCESS_CONFIG,
              title: '¡Cancelada!',
              text: 'La orden de pedido ha sido cancelada.',
            })
            this.reloadDatatable(this.filter)
          },
          error: (error: any) => {
            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: 'Error',
              text: this.getErrorMessage(
                error,
                'No se pudo cancelar la orden de pedido.'
              ),
            })
          },
        })
    })
  }

  public getStatusBadgeClass(status: PurchaseOrderStatus): string {
    switch (status) {
      case PurchaseOrderStatus.INVOICED:
        return 'bg-success'
      case PurchaseOrderStatus.CANCELLED:
        return 'bg-danger'
      default:
        return 'bg-warning text-dark'
    }
  }

  public getInvoiceBadgeClass(
    state?: PurchaseOrderInvoiceState | null
  ): string {
    switch (state) {
      case PurchaseOrderInvoiceState.AUTHORIZED:
      case PurchaseOrderInvoiceState.APPROVED:
        return 'bg-success'
      case PurchaseOrderInvoiceState.FAILED:
      case PurchaseOrderInvoiceState.NOT_APPROVED:
      case PurchaseOrderInvoiceState.RETURNED:
        return 'bg-danger'
      case PurchaseOrderInvoiceState.NEW:
      default:
        return 'bg-warning text-dark'
    }
  }

  public getInvoiceStateLabelKey(order: PurchaseOrder): string {
    if (!order.shouldInvoice) {
      return 'PURCHASE_ORDERS.BILLING.STATE.NOT_APPLICABLE'
    }

    if (!order.invoice) {
      return 'PURCHASE_ORDERS.BILLING.STATE.PENDING_ISSUE'
    }

    const state = order.invoice.state

    switch (state) {
      case PurchaseOrderInvoiceState.AUTHORIZED:
        return 'PURCHASE_ORDERS.BILLING.STATE.AUTHORIZED'
      case PurchaseOrderInvoiceState.APPROVED:
        return 'PURCHASE_ORDERS.BILLING.STATE.APPROVED'
      case PurchaseOrderInvoiceState.RETURNED:
        return 'PURCHASE_ORDERS.BILLING.STATE.RETURNED'
      case PurchaseOrderInvoiceState.NOT_APPROVED:
        return 'PURCHASE_ORDERS.BILLING.STATE.NOT_APPROVED'
      case PurchaseOrderInvoiceState.FAILED:
        return 'PURCHASE_ORDERS.BILLING.STATE.FAILED'
      case PurchaseOrderInvoiceState.NEW:
      default:
        return 'PURCHASE_ORDERS.BILLING.STATE.CREATED'
    }
  }

  public canIssueInvoice(order: PurchaseOrder): boolean {
    return (
      !!order.shouldInvoice &&
      !order.invoice &&
      order.status !== PurchaseOrderStatus.CANCELLED
    )
  }

  public canRetryInvoice(order: PurchaseOrder): boolean {
    const missingExternalId =
      !!order.invoice &&
      (!order.invoice.externalInvoiceId ||
        String(order.invoice.externalInvoiceId).trim().length === 0)

    return (
      !!order.shouldInvoice &&
      !!order.invoice &&
      (order.invoice.state === PurchaseOrderInvoiceState.FAILED ||
        missingExternalId) &&
      order.status !== PurchaseOrderStatus.CANCELLED
    )
  }

  public canAuthorizeInvoice(order: PurchaseOrder): boolean {
    if (
      !order.shouldInvoice ||
      !order.invoice ||
      order.status === PurchaseOrderStatus.CANCELLED
    ) {
      return false
    }

    if (
      !order.invoice.externalInvoiceId ||
      String(order.invoice.externalInvoiceId).trim().length === 0
    ) {
      return false
    }

    return (
      order.invoice.state === PurchaseOrderInvoiceState.NEW ||
      order.invoice.state === PurchaseOrderInvoiceState.NOT_APPROVED ||
      order.invoice.state === PurchaseOrderInvoiceState.RETURNED ||
      order.invoice.state === PurchaseOrderInvoiceState.FAILED
    )
  }

  public canCheckInvoiceStatus(order: PurchaseOrder): boolean {
    if (
      !order.shouldInvoice ||
      !order.invoice ||
      order.status === PurchaseOrderStatus.CANCELLED
    ) {
      return false
    }

    return (
      !!order.invoice.externalInvoiceId &&
      String(order.invoice.externalInvoiceId).trim().length > 0
    )
  }

  public hasInvoiceXml(order: PurchaseOrder): boolean {
    if (!order.invoice) {
      return false
    }

    return (
      !!order.invoice.xmlBase64 ||
      (!!order.invoice.externalInvoiceId &&
        String(order.invoice.externalInvoiceId).trim().length > 0)
    )
  }

  public async issueInvoice(order: PurchaseOrder): Promise<void> {
    const missingFieldKeys = this.getMissingClientBillingFieldKeys(order)

    if (missingFieldKeys.length > 0) {
      const missingFieldsHtml = missingFieldKeys
        .map((fieldKey) => `<li>${this.t(fieldKey)}</li>`)
        .join('')

      await Swal.fire({
        ...SWAL_ERROR_CONFIG,
        title: this.t(
          'PURCHASE_ORDERS.BILLING.MESSAGES.MISSING_CLIENT_DATA_TITLE'
        ),
        html: `<p>${this.t('PURCHASE_ORDERS.BILLING.MESSAGES.MISSING_CLIENT_DATA_TEXT')}</p><ul style="text-align:left;">${missingFieldsHtml}</ul>`,
      })
      return
    }

    const paymentMethodsResponse = await firstValueFrom(
      this.purchaseOrdersService
        .getBillingPaymentMethods()
        .pipe(catchError(() => of(this.getDefaultPaymentMethods())))
    )

    const paymentMethods = Array.isArray(paymentMethodsResponse)
      ? paymentMethodsResponse
      : this.getDefaultPaymentMethods()

    const config = await this.openBillingConfigPrompt(paymentMethods, '01', 15)
    if (!config) {
      return
    }

    this.purchaseOrdersService
      .createInvoice(order.id, config)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            title: this.t(
              'PURCHASE_ORDERS.BILLING.MESSAGES.INVOICE_CREATED_TITLE'
            ),
            text: this.t(
              'PURCHASE_ORDERS.BILLING.MESSAGES.INVOICE_CREATED_TEXT'
            ),
          })
          this.reloadDatatable(this.filter)
        },
        error: (error: any) => {
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: this.t('PURCHASE_ORDERS.BILLING.MESSAGES.ISSUE_ERROR_TITLE'),
            text: this.getErrorMessage(
              error,
              this.t('PURCHASE_ORDERS.BILLING.MESSAGES.ISSUE_ERROR_TEXT')
            ),
          })
        },
      })
  }

  public async retryInvoice(order: PurchaseOrder): Promise<void> {
    const paymentMethodsResponse = await firstValueFrom(
      this.purchaseOrdersService
        .getBillingPaymentMethods()
        .pipe(catchError(() => of(this.getDefaultPaymentMethods())))
    )

    const paymentMethods = Array.isArray(paymentMethodsResponse)
      ? paymentMethodsResponse
      : this.getDefaultPaymentMethods()

    const config = await this.openBillingConfigPrompt(
      paymentMethods,
      order.invoice?.paymentMethod || '01',
      Number(order.invoice?.taxPercent ?? 15)
    )

    if (!config) {
      return
    }

    this.purchaseOrdersService
      .retryInvoice(order.id, config)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            title: this.t(
              'PURCHASE_ORDERS.BILLING.MESSAGES.RETRY_SUCCESS_TITLE'
            ),
            text: this.t('PURCHASE_ORDERS.BILLING.MESSAGES.RETRY_SUCCESS_TEXT'),
          })
          this.reloadDatatable(this.filter)
        },
        error: (error: any) => {
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: this.t('PURCHASE_ORDERS.BILLING.MESSAGES.RETRY_ERROR_TITLE'),
            text: this.getErrorMessage(
              error,
              this.t('PURCHASE_ORDERS.BILLING.MESSAGES.RETRY_ERROR_TEXT')
            ),
          })
        },
      })
  }

  public authorizeInvoice(order: PurchaseOrder): void {
    this.purchaseOrdersService
      .authorizeInvoice(order.id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            title: this.t(
              'PURCHASE_ORDERS.BILLING.MESSAGES.AUTH_SUCCESS_TITLE'
            ),
            text: this.t('PURCHASE_ORDERS.BILLING.MESSAGES.AUTH_SUCCESS_TEXT'),
          })
          this.reloadDatatable(this.filter)
        },
        error: (error: any) => {
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: this.t('PURCHASE_ORDERS.BILLING.MESSAGES.AUTH_ERROR_TITLE'),
            text: this.getErrorMessage(
              error,
              this.t('PURCHASE_ORDERS.BILLING.MESSAGES.AUTH_ERROR_TEXT')
            ),
          })
        },
      })
  }

  public checkInvoiceStatus(order: PurchaseOrder): void {
    this.purchaseOrdersService
      .checkInvoiceStatus(order.id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            title: this.t(
              'PURCHASE_ORDERS.BILLING.MESSAGES.STATUS_SYNC_SUCCESS_TITLE'
            ),
            text: this.t(
              'PURCHASE_ORDERS.BILLING.MESSAGES.STATUS_SYNC_SUCCESS_TEXT'
            ),
          })
          this.reloadDatatable(this.filter)
        },
        error: (error: any) => {
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: this.t(
              'PURCHASE_ORDERS.BILLING.MESSAGES.STATUS_SYNC_ERROR_TITLE'
            ),
            text: this.getErrorMessage(
              error,
              this.t('PURCHASE_ORDERS.BILLING.MESSAGES.STATUS_SYNC_ERROR_TEXT')
            ),
          })
        },
      })
  }

  public viewInvoiceXml(order: PurchaseOrder): void {
    this.purchaseOrdersService
      .getInvoiceXml(order.id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: async (response) => {
          if (!response?.xmlBase64) {
            await Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: this.t(
                'PURCHASE_ORDERS.BILLING.MESSAGES.XML_NOT_AVAILABLE_TITLE'
              ),
              text: this.t(
                'PURCHASE_ORDERS.BILLING.MESSAGES.XML_NOT_AVAILABLE_TEXT'
              ),
            })
            return
          }

          const xmlText = this.decodeBase64Xml(response.xmlBase64)
          const summary = this.extractXmlSummary(xmlText)

          const result = await Swal.fire({
            title: this.t('PURCHASE_ORDERS.BILLING.MESSAGES.XML_PREVIEW_TITLE'),
            html: `
              <div style="text-align:left;display:grid;gap:8px;max-height:380px;overflow:auto;">
                <div><strong>${this.t('PURCHASE_ORDERS.BILLING.XML.LABELS.INVOICE_NUMBER')}:</strong> ${this.escapeHtml(summary.invoiceNumber || '-')}</div>
                <div><strong>${this.t('PURCHASE_ORDERS.BILLING.XML.LABELS.ACCESS_KEY')}:</strong> ${this.escapeHtml(summary.accessKey || '-')}</div>
                <div><strong>${this.t('PURCHASE_ORDERS.BILLING.XML.LABELS.CUSTOMER')}:</strong> ${this.escapeHtml(summary.customerName || '-')}</div>
                <div><strong>${this.t('PURCHASE_ORDERS.BILLING.XML.LABELS.IDENTIFICATION')}:</strong> ${this.escapeHtml(summary.customerId || '-')}</div>
                <div><strong>${this.t('PURCHASE_ORDERS.BILLING.XML.LABELS.DATE')}:</strong> ${this.escapeHtml(summary.issueDate || '-')}</div>
                <div><strong>${this.t('PURCHASE_ORDERS.BILLING.XML.LABELS.TOTAL')}:</strong> ${this.escapeHtml(summary.total || '-')}</div>
              </div>
            `,
            showCancelButton: false,
            showDenyButton: true,
            confirmButtonText: this.t('COMMON.CLOSE'),
            denyButtonText: this.t(
              'PURCHASE_ORDERS.BILLING.ACTION.DOWNLOAD_XML'
            ),
          })

          if (result.isDenied) {
            this.downloadXmlFile(response.xmlBase64, order)
          }
        },
        error: (error: any) => {
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: this.t('PURCHASE_ORDERS.BILLING.MESSAGES.XML_ERROR_TITLE'),
            text: this.getErrorMessage(
              error,
              this.t('PURCHASE_ORDERS.BILLING.MESSAGES.XML_ERROR_TEXT')
            ),
          })
        },
      })
  }

  public downloadInvoiceXml(order: PurchaseOrder): void {
    this.purchaseOrdersService
      .getInvoiceXml(order.id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          if (!response?.xmlBase64) {
            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: this.t(
                'PURCHASE_ORDERS.BILLING.MESSAGES.XML_NOT_AVAILABLE_TITLE'
              ),
              text: this.t(
                'PURCHASE_ORDERS.BILLING.MESSAGES.XML_NOT_AVAILABLE_TEXT'
              ),
            })
            return
          }

          this.downloadXmlFile(response.xmlBase64, order)
        },
        error: (error: any) => {
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: this.t('PURCHASE_ORDERS.BILLING.MESSAGES.XML_ERROR_TITLE'),
            text: this.getErrorMessage(
              error,
              this.t('PURCHASE_ORDERS.BILLING.MESSAGES.XML_ERROR_TEXT')
            ),
          })
        },
      })
  }

  public formatPrice(value?: number): string {
    const amount = Number(value)
    if (!Number.isFinite(amount)) {
      return '$0.00'
    }

    return `$${amount.toFixed(2)}`
  }

  public hasActiveFilters(): boolean {
    return Object.keys(this.filter).length > 0
  }

  private getErrorMessage(error: any, fallback: string): string {
    return (
      error?.error?.message?.es ||
      error?.error?.message?.en ||
      error?.error?.data?.localizedMessage?.es ||
      error?.error?.data?.localizedMessage?.en ||
      error?.error?.data?.error ||
      fallback
    )
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translateService.instant(key, params)
  }

  private getDefaultPaymentMethods(): BillingPaymentMethod[] {
    return [
      { code: '01', name: 'Efectivo', isActive: true },
      { code: '16', name: 'Tarjeta débito', isActive: true },
      { code: '19', name: 'Tarjeta crédito', isActive: true },
      { code: '20', name: 'Transferencia o cheque', isActive: true },
    ]
  }

  private getMissingClientBillingFieldKeys(order: PurchaseOrder): string[] {
    const client = order.client
    if (!client) {
      return ['PURCHASE_ORDERS.BILLING.MISSING.CLIENT']
    }

    const missingKeys: string[] = []

    if (!String(client.documentNumber || '').trim()) {
      missingKeys.push('PURCHASE_ORDERS.BILLING.MISSING.DOCUMENT')
    }

    if (!String(client.email || '').trim()) {
      missingKeys.push('PURCHASE_ORDERS.BILLING.MISSING.EMAIL')
    }

    if (!String(client.address || '').trim()) {
      missingKeys.push('PURCHASE_ORDERS.BILLING.MISSING.ADDRESS')
    }

    const hasPhone =
      String(client.mobilePhone || '').trim().length > 0 ||
      String(client.homePhone || '').trim().length > 0

    if (!hasPhone) {
      missingKeys.push('PURCHASE_ORDERS.BILLING.MISSING.PHONE')
    }

    return missingKeys
  }

  private async openBillingConfigPrompt(
    paymentMethods: BillingPaymentMethod[],
    defaultPaymentMethod: string,
    defaultTaxPercent: number
  ): Promise<CreatePurchaseOrderInvoiceDto | null> {
    const methods =
      Array.isArray(paymentMethods) && paymentMethods.length > 0
        ? paymentMethods
        : this.getDefaultPaymentMethods()

    const paymentOptions = methods
      .map(
        (item) =>
          `<option value="${item.code}" ${item.code === defaultPaymentMethod ? 'selected' : ''}>${item.code} - ${item.name}</option>`
      )
      .join('')

    const taxValues = [0, 5, 12, 13, 14, 15]
    const taxOptions = taxValues
      .map(
        (value) =>
          `<option value="${value}" ${value === defaultTaxPercent ? 'selected' : ''}>${value}%</option>`
      )
      .join('')

    const result = await Swal.fire({
      title: this.t('PURCHASE_ORDERS.BILLING.DIALOG.TITLE'),
      html: `
        <div style="text-align:left;display:grid;gap:12px;">
          <div>
            <label style="display:block;margin-bottom:6px;">${this.t('PURCHASE_ORDERS.BILLING.DIALOG.PAYMENT_METHOD')}</label>
            <select id="billing-payment-method" class="swal2-select" style="width:100%;margin:0;">
              ${paymentOptions}
            </select>
          </div>
          <div>
            <label style="display:block;margin-bottom:6px;">${this.t('PURCHASE_ORDERS.BILLING.DIALOG.TAX_PERCENT')}</label>
            <select id="billing-tax-percent" class="swal2-select" style="width:100%;margin:0;">
              ${taxOptions}
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: this.t('PURCHASE_ORDERS.BILLING.DIALOG.CONFIRM'),
      cancelButtonText: this.t('PURCHASE_ORDERS.BILLING.DIALOG.CANCEL'),
      focusConfirm: false,
      preConfirm: () => {
        const paymentMethod = (
          document.getElementById(
            'billing-payment-method'
          ) as HTMLSelectElement | null
        )?.value
        const taxPercentRaw = (
          document.getElementById(
            'billing-tax-percent'
          ) as HTMLSelectElement | null
        )?.value

        if (!paymentMethod || !taxPercentRaw) {
          Swal.showValidationMessage(
            this.t('PURCHASE_ORDERS.BILLING.DIALOG.VALIDATION_REQUIRED')
          )
          return null
        }

        const taxPercent = Number(taxPercentRaw)
        if (![0, 5, 12, 13, 14, 15].includes(taxPercent)) {
          Swal.showValidationMessage(
            this.t('PURCHASE_ORDERS.BILLING.DIALOG.VALIDATION_TAX_INVALID')
          )
          return null
        }

        return {
          paymentMethod,
          taxPercent,
        }
      },
    })

    if (!result.isConfirmed || !result.value) {
      return null
    }

    return result.value as CreatePurchaseOrderInvoiceDto
  }

  private decodeBase64Xml(base64Value: string): string {
    return atob(base64Value)
  }

  private extractXmlSummary(xmlText: string): {
    invoiceNumber: string | null
    accessKey: string | null
    customerName: string | null
    customerId: string | null
    issueDate: string | null
    total: string | null
  } {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml')

      const estab = this.getXmlTagText(xmlDoc, ['estab'])
      const ptoEmi = this.getXmlTagText(xmlDoc, ['ptoEmi'])
      const secuencial = this.getXmlTagText(xmlDoc, ['secuencial'])
      const composedInvoiceNumber =
        estab && ptoEmi && secuencial
          ? `${estab}-${ptoEmi}-${secuencial}`
          : null

      return {
        invoiceNumber: composedInvoiceNumber,
        accessKey: this.getXmlTagText(xmlDoc, ['claveAcceso']),
        customerName: this.getXmlTagText(xmlDoc, ['razonSocialComprador']),
        customerId: this.getXmlTagText(xmlDoc, ['identificacionComprador']),
        issueDate: this.getXmlTagText(xmlDoc, ['fechaEmision']),
        total: this.getXmlTagText(xmlDoc, ['importeTotal', 'totalSinImpuestos']),
      }
    } catch {
      return {
        invoiceNumber: null,
        accessKey: null,
        customerName: null,
        customerId: null,
        issueDate: null,
        total: null,
      }
    }
  }

  private getXmlTagText(xmlDoc: Document, tags: string[]): string | null {
    for (const tag of tags) {
      const element = xmlDoc.getElementsByTagName(tag)?.[0]
      const value = element?.textContent?.trim()
      if (value) {
        return value
      }
    }

    return null
  }

  private downloadXmlFile(xmlBase64: string, order: PurchaseOrder): void {
    const byteCharacters = atob(xmlBase64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/xml' })
    const fileName = `factura-${order.orderNumber || order.id}.xml`
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}
