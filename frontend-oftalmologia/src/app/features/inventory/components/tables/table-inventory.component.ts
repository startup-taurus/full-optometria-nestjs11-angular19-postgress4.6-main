import { CommonModule } from '@angular/common'
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core'
import { BUTTON_ACTIONS } from '@core/helpers/ui/constants'
import { DEFAULT_NGX_DATATABLE_PAGINATION } from '@core/helpers/ui/ngx-datatable.constant'
import { FORMAT_FOR_DATES } from '@core/helpers/ui/ui.constants'
import { Product } from '@core/interfaces/api/inventory.interface'
import { Branch } from '@core/interfaces/api/branch.interface'
import {
  BootstrapModalConfig,
  ModalWithAction,
} from '@core/interfaces/ui/bootstrap-modal.interface'
import { NgxDatatableConfig } from '@core/interfaces/ui/ngx-datatable.interface'
import { ButtonAction } from '@core/interfaces/ui/ui.interface'
import { ProductService } from '@core/services/api/product.service'
import { BranchService } from '@core/services/api/branch.service'
import {
  ProductsManagementService,
  ProductWithRelations,
} from '@core/services/api/products-management.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { selectSelectedBranchId } from '@core/states/branch/branch.selectors'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  Subject,
  takeUntil,
  tap,
  distinctUntilChanged,
  debounceTime,
} from 'rxjs'
import { NgxDatatableComponent } from '../../../../shared/components/tables/ngx-datatabale/ngx-datatable.component'
import {
  SideFilterPanelComponent,
  FilterValue,
} from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { FilterInventoryComponent } from '../filters/filter-inventory/filter-inventory.component'
import { ViewInventoryComponent } from '../forms/view-inventory/view-inventory.component'
import { CreateEditInventoryComponent } from '../forms/create-edit-inventory/create-edit-inventory.component'
import { TransferStockInventoryComponent } from '../forms/transfer-stock-inventory/transfer-stock-inventory.component'
import { AddStockInventoryComponent } from '../forms/add-stock-inventory/add-stock-inventory.component'
import { ApplyDiscountInventoryComponent } from '../forms/apply-discount-inventory/apply-discount-inventory.component'
import Swal from 'sweetalert2'
import {
  SWAL_DELETE_CONFIRM_CONFIG,
  SWAL_SUCCESS_CONFIG,
  SWAL_ERROR_CONFIG,
} from '@core/helpers/ui/ui.constants'

@Component({
  selector: 'table-inventory',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NgbModule,
    NgxDatatableComponent,
    SideFilterPanelComponent,
  ],
  templateUrl: './table-inventory.component.html',
  styleUrls: ['./table-inventory.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableInventoryComponent implements OnInit, OnDestroy {
  public BUTTON_ACTIONS = BUTTON_ACTIONS
  public FORMAT_FOR_DATES = FORMAT_FOR_DATES
  private PAGINATION = DEFAULT_NGX_DATATABLE_PAGINATION

  public sideFilterComponent = FilterInventoryComponent

  @ViewChild('createdAt', { static: true })
  public createdAtTemplate?: TemplateRef<HTMLElement>
  @ViewChild('updatedAt', { static: true })
  public updatedAtTemplate?: TemplateRef<HTMLElement>
  @ViewChild('statusTemplate', { static: true })
  public statusTemplate?: TemplateRef<HTMLElement>
  @ViewChild('priceTemplate', { static: true })
  public priceTemplate?: TemplateRef<HTMLElement>
  @ViewChild('quantityTemplate', { static: true })
  public quantityTemplate?: TemplateRef<HTMLElement>
  @ViewChild('supplierTemplate', { static: true })
  public supplierTemplate?: TemplateRef<HTMLElement>
  @ViewChild('createdByTemplate', { static: true })
  public createdByTemplate?: TemplateRef<HTMLElement>
  @ViewChild('descriptionTemplate', { static: true })
  public descriptionTemplate?: TemplateRef<HTMLElement>
  @ViewChild('viewsTemplate', { static: true })
  public viewsTemplate?: TemplateRef<HTMLElement>
  @ViewChild('discountTemplate', { static: true })
  public discountTemplate?: TemplateRef<HTMLElement>
  @ViewChild('actionsTemplate', { static: true })
  public actionsTemplate?: TemplateRef<HTMLElement>
  @ViewChild('sideFilterPanel', { static: false })
  public sideFilterPanel?: SideFilterPanelComponent

  public config$ = new BehaviorSubject<Partial<NgxDatatableConfig>>({})
  public data$: Observable<Product[]> = of([])

  private filter: object = {}
  private unsubscribe$: Subject<boolean> = new Subject<boolean>()
  private isInitialLoad = true
  private branchNameMap = new Map<string, string>()

  private _filterCommunicationService = inject(FilterCommunicationService)
  private _productService = inject(ProductService)
  private _branchService = inject(BranchService)
  private _productsManagementService = inject(ProductsManagementService)
  private _bsModalService = inject(BootstrapModalService)
  private _store = inject(Store<AppState>)

  ngOnInit(): void {
    this.initializeSubscriptions()
    this.loadBranchNames()
    this.config$ = this.setConfigDatatable()
  }

  private loadBranchNames(): void {
    this._branchService
      .getAllBranchesForSelector()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((branches: Branch[]) => {
        this.branchNameMap = new Map(
          branches.map((branch) => [branch.id, branch.name])
        )
      })
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
          this.isInitialLoad = true
          this.loadProducts()
        },
        error: (error) => {},
      })

    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged())
      .subscribe({
        next: (filter) => {
          if (!this.isInitialLoad) {
            this.filter = filter || {}
            this.loadProducts()
          }
        },
        error: (err) => {},
      })
  }

  private loadProducts(): void {
    this.data$ = this.loadProductsObservable()
    this.isInitialLoad = false
  }

  private loadProductsObservable() {
    this.config$.next({ ...this.config$.value, loadingIndicator: true })
    return this._productsManagementService.getProducts(this.filter).pipe(
      tap((products) => {
        this.config$.next({
          ...this.config$.value,
          loadingIndicator: false,
          count: products.length,
        })
      }),
      catchError((error) => {
        this.config$.next({ ...this.config$.value, loadingIndicator: false })
        return of([])
      })
    )
  }

  private setConfigDatatable(): BehaviorSubject<Partial<NgxDatatableConfig>> {
    return new BehaviorSubject<Partial<NgxDatatableConfig>>({
      limit: this.PAGINATION.LIMIT,
      page: this.PAGINATION.PAGE,
      columns: [
        {
          name: 'INVENTORY.TABLE.CODE',
          prop: 'code',
          width: 120,
        },
        {
          name: 'INVENTORY.TABLE.NAME',
          prop: 'name',
          width: 200,
        },
        {
          name: 'INVENTORY.TABLE.DESCRIPTION',
          prop: 'description',
          cellTemplate: this.descriptionTemplate ?? undefined,
          width: 200,
        },
        {
          name: 'INVENTORY.TABLE.CREATED_BY',
          prop: 'createdByUser',
          cellTemplate: this.createdByTemplate ?? undefined,
          width: 150,
          sortable: false,
        },
        {
          name: 'INVENTORY.TABLE.BRAND',
          prop: 'brand',
          width: 130,
        },
        {
          name: 'INVENTORY.TABLE.CATEGORY',
          prop: 'category.name',
          width: 140,
        },
        {
          name: 'INVENTORY.TABLE.SUBCATEGORY',
          prop: 'subcategory.name',
          width: 140,
        },
        {
          name: 'INVENTORY.TABLE.SUPPLIER',
          prop: 'defaultSupplier.name',
          cellTemplate: this.supplierTemplate ?? undefined,
          width: 160,
          sortable: false,
        },
        {
          name: 'INVENTORY.TABLE.UNIT_PRICE',
          prop: 'unitPrice',
          cellTemplate: this.priceTemplate ?? undefined,
          width: 120,
          sortable: false,
        },
        {
          name: 'INVENTORY.TABLE.DISCOUNT',
          prop: 'hasActiveDiscount',
          cellTemplate: this.discountTemplate ?? undefined,
          width: 150,
          sortable: false,
        },
        {
          name: 'INVENTORY.TABLE.QUANTITY',
          prop: 'quantity',
          cellTemplate: this.quantityTemplate ?? undefined,
          width: 100,
          sortable: false,
        },
        {
          name: 'INVENTORY.TABLE.VIEWS',
          prop: 'views',
          cellTemplate: this.viewsTemplate ?? undefined,
          width: 90,
          sortable: false,
        },
        {
          name: 'INVENTORY.TABLE.STATUS',
          prop: 'isActive',
          cellTemplate: this.statusTemplate ?? undefined,
          width: 100,
          sortable: false,
        },
        {
          name: 'INVENTORY.TABLE.CREATED_AT',
          prop: 'createdAt',
          cellTemplate: this.createdAtTemplate ?? undefined,
          width: 130,
        },
        {
          name: 'INVENTORY.TABLE.ACTIONS',
          cellTemplate: this.actionsTemplate ?? undefined,
          width: 205,
          sortable: false,
        },
      ],
    })
  }

  public reloadDatatable(filter: object = {}): void {
    this.filter = filter
    this.config$.next({
      ...this.config$.value,
      limit: this.PAGINATION.LIMIT,
      page: this.PAGINATION.PAGE,
    })
    this.data$ = this.loadProductsObservable()
  }

  public onChangeLimit(limit: number): void {
    this.config$.next({
      ...this.config$.value,
      limit,
      page: this.PAGINATION.PAGE,
    })
    this.data$ = this.loadProductsObservable()
  }

  public onChangePage(page: number): void {
    this.config$.next({ ...this.config$.value, page })
    this.data$ = this.loadProductsObservable()
  }

  public openModal(buttonAction: ButtonAction, product?: Product): void {
    if (buttonAction === BUTTON_ACTIONS.ADD) {
      const modalConfig: BootstrapModalConfig<ModalWithAction<Product>> = {
        component: CreateEditInventoryComponent,
        options: {
          size: 'xl',
          backdrop: 'static',
          centered: true,
          windowClass: 'modal-xl modal-dialog-centered',
        },
        data: {
          buttonAction: BUTTON_ACTIONS.ADD,
        },
      }

      const modalRef = this._bsModalService.openModal(modalConfig)

      if (modalRef) {
        modalRef.closed.subscribe((result: string) => {
          if (result === 'created') {
            this.reloadDatatable(this.filter)
          }
        })
      }
    }

    if (buttonAction === BUTTON_ACTIONS.VIEW && product) {
      const modalConfig: BootstrapModalConfig<ModalWithAction<Product>> = {
        component: ViewInventoryComponent,
        options: {
          size: 'lg',
          backdrop: 'static',
          centered: true,
          windowClass: 'modal-lg modal-dialog-centered',
        },
        data: {
          buttonAction: BUTTON_ACTIONS.VIEW,
          selectedRow: product,
        },
      }

      const modalRef = this._bsModalService.openModal(modalConfig)
    }

    if (buttonAction === BUTTON_ACTIONS.EDIT && product) {
      this._productService.getProductById(product.id).subscribe({
        next: (fullProduct) => {
          const modalConfig: BootstrapModalConfig<ModalWithAction<Product>> = {
            component: CreateEditInventoryComponent,
            options: {
              size: 'xl',
              backdrop: 'static',
              centered: true,
              windowClass: 'modal-xl modal-dialog-centered',
            },
            data: {
              buttonAction: BUTTON_ACTIONS.EDIT,
              selectedRow: fullProduct,
            },
          }

          const modalRef = this._bsModalService.openModal(modalConfig)

          if (modalRef) {
            modalRef.closed.subscribe((result: string) => {
              if (result === 'updated') {
                this.reloadDatatable(this.filter)
              }
            })
          }
        },
        error: () => {
          const modalConfig: BootstrapModalConfig<ModalWithAction<Product>> = {
            component: CreateEditInventoryComponent,
            options: {
              size: 'xl',
              backdrop: 'static',
              centered: true,
              windowClass: 'modal-xl modal-dialog-centered',
            },
            data: {
              buttonAction: BUTTON_ACTIONS.EDIT,
              selectedRow: product,
            },
          }

          const modalRef = this._bsModalService.openModal(modalConfig)

          if (modalRef) {
            modalRef.closed.subscribe((result: string) => {
              if (result === 'updated') {
                this.reloadDatatable(this.filter)
              }
            })
          }
        },
      })
    }
  }

  public openTransferModal(product: Product): void {
    if (!product || product.quantity <= 0) {
      return
    }

    const modalRef = this._bsModalService.openModal({
      component: TransferStockInventoryComponent,
      options: {
        size: 'lg',
        backdrop: 'static',
        centered: true,
      },
      data: {
        selectedRow: product,
      },
    })

    if (modalRef) {
      modalRef.closed.subscribe((result: string) => {
        if (result === 'transferred') {
          this.reloadDatatable(this.filter)
        }
      })
    }
  }

  public openAddStockModal(product: Product): void {
    const modalRef = this._bsModalService.openModal({
      component: AddStockInventoryComponent,
      options: {
        size: 'md',
        backdrop: 'static',
        centered: true,
      },
      data: {
        selectedRow: product,
      },
    })

    if (modalRef) {
      modalRef.closed.subscribe((result: string) => {
        if (result === 'stock-added') {
          this.reloadDatatable(this.filter)
        }
      })
    }
  }

  public openApplyDiscountModal(product: Product): void {
    const modalRef = this._bsModalService.openModal({
      component: ApplyDiscountInventoryComponent,
      options: {
        size: 'lg',
        backdrop: 'static',
        centered: true,
      },
      data: {
        selectedRow: product,
      },
    })

    if (modalRef) {
      modalRef.closed.subscribe((result: string) => {
        if (result === 'discount-applied' || result === 'discount-removed') {
          this.reloadDatatable(this.filter)
        }
      })
    }
  }

  public showTransferHistory(product: Product): void {
    this._productService
      .getTransferHistory({ productId: product.id, direction: 'all' })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          const responseData = response?.data as any
          const history = this.extractTransferHistory(responseData)

          if (!history.length) {
            Swal.fire({
              title: 'Sin historial',
              text: 'No hay transferencias registradas para este producto.',
              icon: 'info',
            })
            return
          }

          const html = this.buildTransferHistoryHtml(history, product)

          Swal.fire({
            title: 'Historial de transferencias',
            html,
            width: 980,
            confirmButtonText: 'Cerrar',
          })
        },
        error: () => {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar el historial de transferencias.',
            icon: 'error',
          })
        },
      })
  }

  public showStockHistory(product: Product): void {
    this._productService
      .getProductHistory({ productId: product.id })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          const responseData = response?.data as any
          const history = this.extractTransferHistory(responseData)

          if (!history.length) {
            Swal.fire({
              title: 'Sin historial',
              text: 'No hay eventos registrados para este producto.',
              icon: 'info',
            })
            return
          }

          const html = this.buildProductAuditHtml(history)

          Swal.fire({
            title: `Historial de producto: ${product.name}`,
            html,
            width: 1100,
            confirmButtonText: 'Cerrar',
          })
        },
        error: () => {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar el historial del producto.',
            icon: 'error',
          })
        },
      })
  }

  private extractTransferHistory(payload: any): any[] {
    if (Array.isArray(payload)) {
      return payload
    }

    if (Array.isArray(payload?.result)) {
      return payload.result
    }

    if (Array.isArray(payload?.data)) {
      return payload.data
    }

    if (Array.isArray(payload?.data?.result)) {
      return payload.data.result
    }

    if (Array.isArray(payload?.data?.data)) {
      return payload.data.data
    }

    return []
  }

  private getBranchName(branchId: string | undefined): string {
    if (!branchId) {
      return 'Sucursal no identificada'
    }

    return this.branchNameMap.get(branchId) || branchId
  }

  private buildTransferHistoryHtml(
    history: any[],
    currentProduct: Product
  ): string {
    const cards = history.slice(0, 25).map((item: any) => {
      const isSent = item.sourceProductId === currentProduct.id
      const movementLabel = isSent ? 'Enviado' : 'Recibido'
      const movementColor = isSent ? '#dc3545' : '#198754'
      const sourceBranch = this.getBranchName(item.sourceBranchId)
      const targetBranch = this.getBranchName(item.targetBranchId)
      const productName =
        item.sourceProduct?.name ||
        item.targetProduct?.name ||
        currentProduct.name ||
        '-'
      const productCode = item.sourceCode || currentProduct.code || '-'
      const quantity = item.quantity ?? '-'
      const sourceBalanceAfter = item.sourceBalanceAfterTransfer ?? '-'
      const targetBalanceAfter = item.targetBalanceAfterTransfer ?? '-'
      const transferNote = item.note || 'Sin nota'
      const sentBy = item.createdByUser
        ? `${item.createdByUser.firstName || ''} ${item.createdByUser.lastName || ''}`.trim() ||
          item.createdByUser.username ||
          item.createdByUser.email ||
          '-'
        : '-'
      const date = item.createdAt
        ? new Date(item.createdAt).toLocaleString('es-EC')
        : '-'

      return `
        <div style="border:1px solid #e9ecef;border-radius:10px;padding:12px 14px;margin-bottom:10px;background:#ffffff;box-shadow:0 1px 2px rgba(16,24,40,0.06);text-align:left;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${movementColor};color:#fff;font-weight:700;font-size:12px;">${movementLabel}</span>
            <span style="color:#667085;font-size:12px;">${date}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px;font-size:13px;color:#1f2937;">
            <div><strong>Desde:</strong> ${sourceBranch}</div>
            <div><strong>Hacia:</strong> ${targetBranch}</div>
            <div><strong>Código:</strong> ${productCode}</div>
            <div><strong>Producto:</strong> ${productName}</div>
            <div><strong>Cantidad:</strong> ${quantity}</div>
            <div><strong>Enviado por:</strong> ${sentBy}</div>
            <div><strong>Stock origen después:</strong> ${sourceBalanceAfter}</div>
            <div><strong>Stock destino después:</strong> ${targetBalanceAfter}</div>
            <div style="grid-column:1 / -1;"><strong>Nota:</strong> ${transferNote}</div>
          </div>
        </div>
      `
    })

    return `<div style="max-height:68vh;overflow:auto;padding:2px 2px 0 2px;background:#f8fafc;border-radius:10px;">${cards.join('')}</div>`
  }

  private buildStockHistoryHtml(history: any[]): string {
    const movementTypeLabel: Record<string, string> = {
      STOCK_INICIAL: 'Stock inicial',
      INGRESO_AJUSTE_MANUAL: 'Ingreso por ajuste',
      SALIDA_AJUSTE_MANUAL: 'Salida por ajuste',
      SALIDA_ELIMINACION: 'Salida por eliminación',
      INGRESO_TRANSFERENCIA: 'Ingreso por transferencia',
      SALIDA_TRANSFERENCIA: 'Salida por transferencia',
    }

    const rows = history
      .slice(0, 100)
      .map((item: any) => {
        const movementType = movementTypeLabel[item.movementType] || item.movementType || '-'
        const quantity = item.quantity ?? 0
        const balanceAfter = item.balanceAfter ?? '-'
        const user = item.createdByUser
          ? `${item.createdByUser.firstName || ''} ${item.createdByUser.lastName || ''}`.trim() ||
            item.createdByUser.username ||
            item.createdByUser.email ||
            '-'
          : '-'
        const date = item.createdAt
          ? new Date(item.createdAt).toLocaleString('es-EC')
          : '-'
        const note = item.note || '-'

        return `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eef2f7;white-space:nowrap;">${date}</td>
            <td style="padding:8px;border-bottom:1px solid #eef2f7;">${movementType}</td>
            <td style="padding:8px;border-bottom:1px solid #eef2f7;text-align:right;">${quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eef2f7;text-align:right;">${balanceAfter}</td>
            <td style="padding:8px;border-bottom:1px solid #eef2f7;">${user}</td>
            <td style="padding:8px;border-bottom:1px solid #eef2f7;">${note}</td>
          </tr>
        `
      })
      .join('')

    return `
      <div style="max-height:68vh;overflow:auto;border:1px solid #e5e7eb;border-radius:10px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left;background:#fff;">
          <thead>
            <tr style="background:#f8fafc;color:#0f172a;">
              <th style="padding:10px;border-bottom:1px solid #e5e7eb;">Fecha</th>
              <th style="padding:10px;border-bottom:1px solid #e5e7eb;">Tipo</th>
              <th style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">Cantidad</th>
              <th style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">Saldo</th>
              <th style="padding:10px;border-bottom:1px solid #e5e7eb;">Usuario</th>
              <th style="padding:10px;border-bottom:1px solid #e5e7eb;">Nota</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `
  }

  private buildProductAuditHtml(history: any[]): string {
    const eventConfig: Record<string, { label: string; color: string; bg: string }> = {
      CREATED:          { label: 'Creación',           color: '#166534', bg: '#dcfce7' },
      UPDATED:          { label: 'Actualización',      color: '#1e40af', bg: '#dbeafe' },
      DISCOUNT_APPLIED: { label: 'Descuento aplicado', color: '#92400e', bg: '#fef3c7' },
      DISCOUNT_REMOVED: { label: 'Descuento eliminado',color: '#7c3aed', bg: '#ede9fe' },
      DEACTIVATED:      { label: 'Eliminado',          color: '#991b1b', bg: '#fee2e2' },
    }

    const fieldLabels: Record<string, string> = {
      name: 'Nombre', description: 'Descripción', brand: 'Marca',
      code: 'Código', unitPrice: 'Precio', quantity: 'Cantidad',
      categoryId: 'Categoría', subcategoryId: 'Subcategoría',
      defaultSupplierId: 'Proveedor', isActive: 'Activo',
    }

    const renderChangedFields = (changedFields: Record<string, { from: any; to: any }> | null): string => {
      if (!changedFields || !Object.keys(changedFields).length) return ''
      const lines = Object.entries(changedFields).map(([key, val]) => {
        const label = fieldLabels[key] || key
        return `<div style="margin:2px 0;"><strong>${label}:</strong> <span style="color:#6b7280;text-decoration:line-through;">${val.from}</span> → <span style="color:#111827;font-weight:600;">${val.to}</span></div>`
      })
      return `<div style="margin-top:6px;font-size:12px;">${lines.join('')}</div>`
    }

    const renderMetadata = (eventType: string, metadata: Record<string, any> | null): string => {
      if (!metadata) return ''
      if (eventType === 'CREATED') {
        const syntheticNote = metadata['_synthetic']
          ? `<div style="margin-top:4px;font-size:11px;color:#6b7280;font-style:italic;">⚠ Este evento fue reconstruido desde la fecha de creación del producto (anterior al sistema de auditoría)</div>`
          : ''
        return `<div style="margin-top:6px;font-size:12px;color:#374151;">Código: <strong>${metadata['code'] || '-'}</strong> · Precio: <strong>$${metadata['unitPrice'] ?? '-'}</strong> · Stock inicial: <strong>${metadata['quantity'] ?? 0}</strong></div>${syntheticNote}`
      }
      if (eventType === 'DISCOUNT_APPLIED' || eventType === 'DISCOUNT_REMOVED') {
        const type = metadata['discountType'] === 'PERCENTAGE' ? '%' : '$'
        const val = metadata['discountValue'] ?? '-'
        const start = metadata['startDate'] ? new Date(metadata['startDate']).toLocaleDateString('es-EC') : '-'
        const end = metadata['endDate'] ? new Date(metadata['endDate']).toLocaleDateString('es-EC') : '-'
        return `<div style="margin-top:6px;font-size:12px;color:#374151;">Tipo: <strong>${metadata['discountType'] || '-'}</strong> · Valor: <strong>${val}${type}</strong> · Vigencia: ${start} – ${end}</div>`
      }
      if (eventType === 'DEACTIVATED') {
        return `<div style="margin-top:6px;font-size:12px;color:#374151;">Stock al eliminar: <strong>${metadata['quantityAtDeletion'] ?? 0}</strong></div>`
      }
      return ''
    }

    const cards = history.slice(0, 200).map((item: any) => {
      const cfg = eventConfig[item.eventType] || { label: item.eventType, color: '#374151', bg: '#f3f4f6' }
      const user = item.createdByUser
        ? `${item.createdByUser.firstName || ''} ${item.createdByUser.lastName || ''}`.trim() ||
          item.createdByUser.username || item.createdByUser.email || '-'
        : '-'
      const date = item.createdAt ? new Date(item.createdAt).toLocaleString('es-EC') : '-'
      const changedHtml = renderChangedFields(item.changedFields)
      const metaHtml = renderMetadata(item.eventType, item.metadata)

      return `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;margin-bottom:8px;background:#fff;text-align:left;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${cfg.bg};color:${cfg.color};font-weight:700;font-size:11px;">${cfg.label}</span>
            <span style="color:#6b7280;font-size:12px;">👤 ${user} &nbsp;·&nbsp; 🕐 ${date}</span>
          </div>
          ${changedHtml}${metaHtml}
        </div>
      `
    })

    return `<div style="max-height:70vh;overflow:auto;padding:4px;background:#f8fafc;border-radius:10px;">${cards.join('')}</div>`
  }

  public toggleProductStatus(product: Product): void {
    const newStatus = !product.isActive
    const action = newStatus ? 'activar' : 'desactivar'
    const actionTitle = newStatus ? 'Activar Producto' : 'Desactivar Producto'
    const actionText = `¿Está seguro que desea ${action} el producto "${product.name}"?`
    const actionButtonText = newStatus ? 'Sí, activar' : 'Sí, desactivar'
    const successTitle = newStatus
      ? 'Producto Activado'
      : 'Producto Desactivado'
    const successText = `El producto "${product.name}" ha sido ${action}do exitosamente.`

    Swal.fire({
      title: actionTitle,
      text: actionText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#28a745' : '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: actionButtonText,
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Procesando...',
          text: `${newStatus ? 'Activando' : 'Desactivando'} producto`,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading()
          },
        })

        this._productService
          .updateProduct(product.id, { isActive: newStatus })
          .subscribe({
            next: () => {
              Swal.fire({
                title: successTitle,
                text: successText,
                icon: 'success',
                confirmButtonColor: '#007bff',
                timer: 2000,
                showConfirmButton: false,
              })
              this.reloadDatatable(this.filter)
            },
            error: (err) => {
              Swal.fire({
                title: 'Error',
                text: `No se pudo ${action} el producto. Por favor, inténtelo de nuevo.`,
                icon: 'error',
                confirmButtonColor: '#dc3545',
              })
            },
          })
      }
    })
  }

  public onSideFilterApplied(filters: FilterValue): void {
    this.filter = filters
    this.reloadDatatable(this.filter)
  }

  public onSideFilterCleared(): void {
    this.filter = {}
    this.reloadDatatable(this.filter)
  }

  public hasActiveFilters(): boolean {
    return Object.keys(this.filter).length > 0
  }

  public clearAllFilters(): void {
    this.filter = {}
    this._filterCommunicationService.resetFilter()
    this.reloadDatatable(this.filter)
  }

  public deleteProduct(product: Product): void {
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this._productService.deleteProduct(product.id).subscribe({
          next: () => {
            Swal.fire({
              ...SWAL_SUCCESS_CONFIG,
              title: '¡Eliminado!',
              text: 'El producto ha sido eliminado exitosamente.',
            })
            this.reloadDatatable(this.filter)
          },
          error: (err) => {
            let errorMessage =
              'No se pudo eliminar el producto. Por favor, intenta nuevamente.'

            if (err?.error?.message) {
              const backendMessage = err.error.message

              if (
                typeof backendMessage === 'object' &&
                (backendMessage.es || backendMessage.en)
              ) {
                errorMessage = backendMessage.es || backendMessage.en
              } else if (typeof backendMessage === 'string') {
                errorMessage = backendMessage
              }
            }

            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: 'Error',
              text: errorMessage,
            })
          },
        })
      }
    })
  }

  // public getProductImageUrl(product: Product): string {
  //   if (product.images && product.images.length > 0) {
  //     const coverImage = product.images.find((img) => img.isCover)
  //     const imageToShow = coverImage || product.images[0]
  //     return this._productService.getImageUrl(imageToShow.path)
  //   }
  //   return 'assets/images/placeholder-product.png'
  // }
}
