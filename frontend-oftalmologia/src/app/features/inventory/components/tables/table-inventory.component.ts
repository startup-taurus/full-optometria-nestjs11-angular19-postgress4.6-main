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
import {
  BootstrapModalConfig,
  ModalWithAction,
} from '@core/interfaces/ui/bootstrap-modal.interface'
import { NgxDatatableConfig } from '@core/interfaces/ui/ngx-datatable.interface'
import { ButtonAction } from '@core/interfaces/ui/ui.interface'
import { ProductService } from '@core/services/api/product.service'
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
import Swal from 'sweetalert2'
import { SWAL_DELETE_CONFIRM_CONFIG, SWAL_SUCCESS_CONFIG, SWAL_ERROR_CONFIG } from '@core/helpers/ui/ui.constants'

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
  @ViewChild('actionsTemplate', { static: true })
  public actionsTemplate?: TemplateRef<HTMLElement>
  @ViewChild('sideFilterPanel', { static: false })
  public sideFilterPanel?: SideFilterPanelComponent

  public config$ = new BehaviorSubject<Partial<NgxDatatableConfig>>({})
  public data$: Observable<Product[]> = of([])

  private filter: object = {}
  private unsubscribe$: Subject<boolean> = new Subject<boolean>()
  private isInitialLoad = true

  private _filterCommunicationService = inject(FilterCommunicationService)
  private _productService = inject(ProductService)
  private _productsManagementService = inject(ProductsManagementService)
  private _bsModalService = inject(BootstrapModalService)
  private _store = inject(Store<AppState>)

  ngOnInit(): void {
    this.initializeSubscriptions()
    this.config$ = this.setConfigDatatable()
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
          width: 280,
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

  public showTransferHistory(product: Product): void {
    this._productService
      .getTransferHistory({ productId: product.id, direction: 'all' })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          const responseData = response?.data as any
          const history = responseData?.result || responseData || []

          if (!history.length) {
            Swal.fire({
              title: 'Sin historial',
              text: 'No hay transferencias registradas para este producto.',
              icon: 'info',
            })
            return
          }

          const html = history
            .slice(0, 20)
            .map((item: any) => {
              const type =
                item.sourceProductId === product.id ? 'Enviado' : 'Recibido'
              const date = item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : '-'
              return `<div style="text-align:left;margin-bottom:8px;"><strong>${type}</strong> | Cantidad: ${item.quantity} | Codigo: ${item.sourceCode} | Fecha: ${date}</div>`
            })
            .join('')

          Swal.fire({
            title: 'Historial de transferencias',
            html,
            width: 800,
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
              console.error(`Error ${action}ing product:`, err)
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
            let errorMessage = 'No se pudo eliminar el producto. Por favor, intenta nuevamente.'
            
            if (err?.error?.message) {
              const backendMessage = err.error.message
              
              if (typeof backendMessage === 'object' && (backendMessage.es || backendMessage.en)) {
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
