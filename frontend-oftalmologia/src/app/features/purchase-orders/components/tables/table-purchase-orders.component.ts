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
import { TranslateModule } from '@ngx-translate/core'
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap'
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  distinctUntilChanged,
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

@Component({
  selector: 'table-purchase-orders',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NgbModule,
    PageTitleComponent,
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
      .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged(), debounceTime(300))
      .subscribe(() => {
        if (!this.hasInitializedBranchSubscription) {
          this.hasInitializedBranchSubscription = true
          return
        }

        this.reloadDatatable(this.filter)
      })
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
          width: 140,
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
          width: 180,
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
    const modalRef = this.modalService.open(CreateEditPurchaseOrderModalComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
    })

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
      text: `¿Desea eliminar la orden #${order.orderNumber || '-'}?`,
      confirmButtonText: 'Sí, eliminar',
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
              title: '¡Eliminado!',
              text: 'La orden de pedido ha sido eliminada.',
            })
            this.reloadDatatable(this.filter)
          },
          error: () => {
            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: 'Error',
              text: 'No se pudo eliminar la orden de pedido.',
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
}
