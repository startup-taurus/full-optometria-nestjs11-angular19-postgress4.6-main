import { CommonModule } from '@angular/common'
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnDestroy,
  OnInit,
  AfterViewInit,
  TemplateRef,
  ViewChild,
} from '@angular/core'
import { BUTTON_ACTIONS } from '@core/helpers/ui/constants'
import { DEFAULT_NGX_DATATABLE_PAGINATION } from '@core/helpers/ui/ngx-datatable.constant'
import { FORMAT_FOR_DATES } from '@core/helpers/ui/ui.constants'
import { Supplier } from '@core/interfaces/api/supplier.interface'
import {
  BootstrapModalConfig,
  ModalWithAction,
} from '@core/interfaces/ui/bootstrap-modal.interface'
import { NgxDatatableConfig } from '@core/interfaces/ui/ngx-datatable.interface'
import { ButtonAction } from '@core/interfaces/ui/ui.interface'
import { SupplierService } from '@core/services/api/supplier.service'
import { SuppliersManagementService } from '@core/services/api/suppliers-management.service'
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
  skip,
} from 'rxjs'
import { PageTitleComponent } from '../../../../shared/components/layouts/page-title/page-title.component'
import { NgxDatatableComponent } from '../../../../shared/components/tables/ngx-datatabale/ngx-datatable.component'
import {
  SideFilterPanelComponent,
  FilterValue,
} from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { CreateEditSupplierComponent } from '../modals/create-edit-supplier/create-edit-supplier.component'
import { ViewSupplierComponent } from '../modals/view-supplier/view-supplier.component'
import { SuppliersFilterComponent } from '../filters/suppliers-filter.component'
// import { ErrorHandlerUtil } from '@core/helpers/error-handler.util'
import Swal from 'sweetalert2'
import { SWAL_DELETE_CONFIRM_CONFIG, SWAL_SUCCESS_CONFIG, SWAL_ERROR_CONFIG } from '@core/helpers/ui/ui.constants'

@Component({
  selector: 'app-suppliers-table',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NgbModule,
    NgxDatatableComponent,
    SideFilterPanelComponent,
  ],
  templateUrl: './suppliers-table.component.html',
  styleUrls: ['./suppliers-table.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SuppliersTableComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  public BUTTON_ACTIONS = BUTTON_ACTIONS
  public FORMAT_FOR_DATES = FORMAT_FOR_DATES
  private PAGINATION = DEFAULT_NGX_DATATABLE_PAGINATION

  public sideFilterComponent = SuppliersFilterComponent

  @ViewChild('createdAtTemplate', { static: false })
  public createdAtTemplate?: TemplateRef<HTMLElement>
  @ViewChild('updatedAtTemplate', { static: false })
  public updatedAtTemplate?: TemplateRef<HTMLElement>
  @ViewChild('statusTemplate', { static: false })
  public statusTemplate?: TemplateRef<HTMLElement>
  @ViewChild('actionsTemplate', { static: false })
  public actionsTemplate?: TemplateRef<HTMLElement>
  @ViewChild('contactTemplate', { static: false })
  public contactTemplate?: TemplateRef<HTMLElement>
  @ViewChild('sideFilterPanel', { static: false })
  public sideFilterPanel?: SideFilterPanelComponent

  public config$ = new BehaviorSubject<Partial<NgxDatatableConfig>>({})
  public data$: Observable<Supplier[]> = of([])

  private filter: object = {}
  private unsubscribe$: Subject<boolean> = new Subject<boolean>()

  private _filterCommunicationService = inject(FilterCommunicationService)
  private _supplierService = inject(SupplierService)
  private _suppliersManagementService = inject(SuppliersManagementService)
  private _bsModalService = inject(BootstrapModalService)
  private _store = inject(Store<AppState>)

  ngOnInit(): void {
    this.initializeSubscriptions()
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.config$ = this.setConfigDatatable()
    }, 0)
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
        next: () => {
          this.loadSuppliers()
        },
        error: (error) => {},
      })

    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this.unsubscribe$), skip(1), distinctUntilChanged())
      .subscribe({
        next: (filter) => {
          this.filter = filter || {}
          this.loadSuppliers()
        },
        error: (err) => {},
      })
  }

  private loadSuppliers(): void {
    this.data$ = this.loadSuppliersObservable()
  }

  private loadSuppliersObservable() {
    this.config$.next({ ...this.config$.value, loadingIndicator: true })
    return this._suppliersManagementService.getSuppliers(this.filter).pipe(
      tap((suppliers) => {
        this.config$.next({
          ...this.config$.value,
          loadingIndicator: false,
          count: suppliers.length,
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
          name: 'SUPPLIERS.TABLE.NAME',
          prop: 'name',
          width: 200,
          isPrimary: true,
        },
        {
          name: 'SUPPLIERS.TABLE.RUT',
          prop: 'documentNumber',
          width: 150,
        },
        {
          name: 'SUPPLIERS.TABLE.EMAIL',
          prop: 'email',
          width: 200,
        },
        {
          name: 'SUPPLIERS.TABLE.PHONE',
          prop: 'phone',
          width: 150,
        },
        {
          name: 'SUPPLIERS.TABLE.STATUS',
          cellTemplate: this.statusTemplate,
          width: 100,
          sortable: false,
        },
        {
          name: 'SUPPLIERS.TABLE.CREATED_AT',
          cellTemplate: this.createdAtTemplate,
          prop: 'createdAt',
          width: 150,
          hideOnMobile: true,
        },
        {
          name: 'SUPPLIERS.TABLE.UPDATED_AT',
          cellTemplate: this.updatedAtTemplate,
          prop: 'updatedAt',
          width: 150,
          hideOnMobile: true,
        },
        {
          name: 'SUPPLIERS.TABLE.CONTACT',
          cellTemplate: this.contactTemplate,
          width: 160,
          sortable: false,
        },
        {
          name: 'SUPPLIERS.TABLE.ACTIONS',
          cellTemplate: this.actionsTemplate,
          width: 190,
          sortable: false,
          isActions: true,
        },
      ],
    })
  }

  public onChangeLimit(limit: number): void {
    this.config$.next({
      ...this.config$.value,
      limit,
      page: this.PAGINATION.PAGE,
    })
    this.data$ = this.loadSuppliersObservable()
  }

  public onChangePage(page: number): void {
    this.config$.next({ ...this.config$.value, page })
    this.data$ = this.loadSuppliersObservable()
  }

  public reloadDatatable(filter: object = {}): void {
    this.filter = filter
    this.config$.next({
      ...this.config$.value,
      limit: this.PAGINATION.LIMIT,
      page: this.PAGINATION.PAGE,
    })
    this.data$ = this.loadSuppliersObservable()
  }

  public openModal(buttonAction: ButtonAction, supplier?: Supplier): void {
    if (buttonAction === BUTTON_ACTIONS.ADD) {
      this.openCreateEditModal(buttonAction)
    }

    if (buttonAction === BUTTON_ACTIONS.VIEW && supplier) {
      this.openViewModal(buttonAction, supplier)
    }

    if (buttonAction === BUTTON_ACTIONS.EDIT && supplier) {
      this.openCreateEditModal(buttonAction, supplier)
    }

    if (buttonAction === BUTTON_ACTIONS.DELETE && supplier) {
      this.confirmDeleteSupplier(supplier)
    }
  }

  private openCreateEditModal(
    buttonAction: ButtonAction,
    supplier?: Supplier
  ): void {
    const modalConfig: BootstrapModalConfig<ModalWithAction<Supplier>> = {
      component: CreateEditSupplierComponent,
      options: {
        size: 'lg',
        backdrop: 'static',
        centered: true,
        windowClass: 'modal-lg modal-dialog-centered',
      },
      data: {
        buttonAction,
        selectedRow: supplier,
      },
    }

    const modalRef = this._bsModalService.openModal(modalConfig)

    if (modalRef) {
      modalRef.closed.subscribe((result: string) => {
        if (result === 'created' || result === 'updated') {
          this.reloadDatatable(this.filter)
        }
      })
    }
  }

  private openViewModal(buttonAction: ButtonAction, supplier: Supplier): void {
    const modalConfig: BootstrapModalConfig<ModalWithAction<Supplier>> = {
      component: ViewSupplierComponent,
      options: {
        size: 'lg',
        backdrop: 'static',
        centered: true,
        windowClass: 'modal-lg modal-dialog-centered',
      },
      data: {
        buttonAction,
        selectedRow: supplier,
      },
    }

    const modalRef = this._bsModalService.openModal(modalConfig)
  }

  private confirmDeleteSupplier(supplier: Supplier): void {
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el proveedor "${supplier.name}"? Esta acción no se puede deshacer.`,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteSupplier(supplier)
      }
    })
  }

  private deleteSupplier(supplier: Supplier): void {
    this._supplierService.deleteSupplier(supplier.id).subscribe({
      next: () => {
        Swal.fire({
          ...SWAL_SUCCESS_CONFIG,
          title: '¡Eliminado!',
          text: 'El proveedor ha sido eliminado exitosamente.',
        })
        this.reloadDatatable(this.filter)
      },
      error: (err) => {
        let errorMessage = 'No se pudo eliminar el proveedor.'
        
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

  public openSupplierWhatsApp(supplier: Supplier): void {
    const phone = this.formatPhoneForWhatsApp(supplier.phone)
    if (!phone) {
      return
    }

    const message = encodeURIComponent(
      `Hola, me gustaría obtener información sobre ${supplier.name}.`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  public openSupplierEmail(supplier: Supplier): void {
    if (!supplier.email) {
      return
    }

    const subject = encodeURIComponent(`Consulta - proveedor ${supplier.name}`)
    window.location.href = `mailto:${supplier.email}?subject=${subject}`
  }

  public openSupplierWebsite(supplier: Supplier): void {
    if (!supplier.website) {
      return
    }

    const normalizedWebsite = /^(https?:\/\/)/i.test(supplier.website)
      ? supplier.website
      : `https://${supplier.website}`

    window.open(normalizedWebsite, '_blank')
  }

  public canOpenWhatsApp(supplier: Supplier): boolean {
    return !!this.formatPhoneForWhatsApp(supplier.phone)
  }

  private formatPhoneForWhatsApp(phone?: string): string {
    if (!phone) {
      return ''
    }

    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length >= 8 ? cleanPhone : ''
  }
}
