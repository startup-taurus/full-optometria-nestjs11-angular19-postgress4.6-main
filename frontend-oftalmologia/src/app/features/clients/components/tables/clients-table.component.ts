import { CommonModule } from '@angular/common'
import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core'
import Swal from 'sweetalert2'
import {
  SWAL_DELETE_CONFIRM_CONFIG,
  SWAL_ERROR_CONFIG,
  SWAL_SUCCESS_CONFIG,
} from '@core/helpers/ui/ui.constants'
import { Client, ClientQueryParams } from '@core/interfaces/api/client.interface'
import { ClientsService } from '@core/services/api/clients.service'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import {
  BehaviorSubject,
  Observable,
  Subject,
  of,
  takeUntil,
  tap,
  map,
  catchError,
  distinctUntilChanged,
  debounceTime,
} from 'rxjs'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { selectSelectedBranchId } from '@core/states/branch/branch.selectors'
import {
  SideFilterPanelComponent,
} from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { NgxDatatableComponent } from '../../../../shared/components/tables/ngx-datatabale/ngx-datatable.component'
import { NgxDatatableConfig } from '@core/interfaces/ui/ngx-datatable.interface'
import { DEFAULT_NGX_DATATABLE_PAGINATION } from '@core/helpers/ui/ngx-datatable.constant'
import { ClientFilterComponent } from '../filters/client-filter.component'
import { ClientDetailsModalComponent } from '../modals/client-details-modal.component'
import { ClientModalComponent } from '../../../laboratoy-orders/components/modals/client-modal/client-modal.component'
import { TableExportButtonsComponent } from '../../../../shared/components/table-export-buttons/table-export-buttons.component'
import { ExportColumn } from '@core/services/ui/table-export.service'

@Component({
  selector: 'app-clients-table',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NgbModule,
    SideFilterPanelComponent,
    NgxDatatableComponent,
    TableExportButtonsComponent,
  ],
  templateUrl: './clients-table.component.html',
  styleUrls: ['./clients-table.component.scss'],
})
export class ClientsTableComponent implements OnInit, OnDestroy {
  private pagination = DEFAULT_NGX_DATATABLE_PAGINATION

  @ViewChild('sideFilterPanel', { static: false })
  public sideFilterPanel?: SideFilterPanelComponent

  @ViewChild('nameTemplate', { static: true })
  public nameTemplate?: TemplateRef<HTMLElement>

  @ViewChild('patientLinkTemplate', { static: true })
  public patientLinkTemplate?: TemplateRef<HTMLElement>

  @ViewChild('statusTemplate', { static: true })
  public statusTemplate?: TemplateRef<HTMLElement>

  @ViewChild('actionsTemplate', { static: true })
  public actionsTemplate?: TemplateRef<HTMLElement>

  public sideFilterComponent = ClientFilterComponent
  public config$ = new BehaviorSubject<Partial<NgxDatatableConfig>>({})
  public data$: Observable<Client[]> = of([])
  public latestRows: Client[] = []
  public exportColumns: ExportColumn<Client>[] = []

  public filter: ClientQueryParams = {}
  private _destroy$ = new Subject<void>()
  private hasInitializedBranchSubscription = false

  private _clientsService = inject(ClientsService)
  private _filterCommunicationService = inject(FilterCommunicationService)
  private _modalService = inject(NgbModal)
  private _translate = inject(TranslateService)
  private _notificationService = inject(ToastrNotificationService)
  private _store = inject(Store<AppState>)

  ngOnInit(): void {
    this.config$ = this.setConfigDatatable()
    this.exportColumns = this.buildExportColumns()
    this.subscribeToBranchChanges()

    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this._destroy$))
      .subscribe((filter) => {
        this.filter = this.sanitizeFilter((filter || {}) as ClientQueryParams)
        this.reloadDatatable(this.filter)
      })

    this._filterCommunicationService.resetFilter()
  }

  private buildExportColumns(): ExportColumn<Client>[] {
    const translate = this._translate
    return [
      {
        label: translate.instant('CLIENT.SINGULAR'),
        formatter: (row) =>
          `${row.firstName || ''} ${row.lastName || ''}`.trim() || '-',
      },
      {
        label: translate.instant('CLIENT.DOCUMENT_NUMBER'),
        key: 'documentNumber',
      },
      { label: translate.instant('CLIENT.EMAIL'), key: 'email' },
      {
        label: translate.instant('WORDS.PHONE'),
        formatter: (row) => row.mobilePhone || row.homePhone || '-',
      },
      {
        label: translate.instant('CLIENT.PATIENT_LINK'),
        formatter: (row) => this.getPatientLabel(row),
      },
      {
        label: translate.instant('COMMON.STATUS'),
        formatter: (row) =>
          translate.instant(row.isActive ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE'),
      },
    ]
  }

  private subscribeToBranchChanges(): void {
    this._store
      .select(selectSelectedBranchId)
      .pipe(takeUntil(this._destroy$), distinctUntilChanged(), debounceTime(300))
      .subscribe(() => {
        if (!this.hasInitializedBranchSubscription) {
          this.hasInitializedBranchSubscription = true
          return
        }

        this.reloadDatatable(this.filter)
      })
  }

  ngOnDestroy(): void {
    this._destroy$.next()
    this._destroy$.complete()
  }

  private setConfigDatatable(): BehaviorSubject<Partial<NgxDatatableConfig>> {
    return new BehaviorSubject<Partial<NgxDatatableConfig>>({
      limit: this.pagination.LIMIT,
      page: this.pagination.PAGE,
      columns: [
        {
          name: 'CLIENT.SINGULAR',
          cellTemplate: this.nameTemplate,
          width: 230,
          sortable: false,
          isPrimary: true,
        },
        {
          name: 'CLIENT.DOCUMENT_NUMBER',
          prop: 'documentNumber',
          width: 170,
        },
        {
          name: 'CLIENT.EMAIL',
          prop: 'email',
          width: 250,
        },
        {
          name: 'CLIENT.PATIENT_LINK',
          cellTemplate: this.patientLinkTemplate,
          width: 220,
          sortable: false,
        },
        {
          name: 'COMMON.STATUS',
          cellTemplate: this.statusTemplate,
          width: 120,
          sortable: false,
        },
        {
          name: 'COMMON.ACTIONS',
          cellTemplate: this.actionsTemplate,
          width: 220,
          sortable: false,
          isActions: true,
        },
      ],
    })
  }

  private loadClientsObservable(): Observable<Client[]> {
    this.config$.next({ ...this.config$.value, loadingIndicator: true })

    const queryParams: ClientQueryParams = {
      ...this.filter,
      page: this.config$.value.page,
      limit: this.config$.value.limit,
    }

    return this._clientsService.getAllGlobal(queryParams).pipe(
      tap((response) => {
        this.latestRows = response.data || []
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

  public reloadDatatable(filter: ClientQueryParams = {}): void {
    this.filter = filter
    this.config$.next({
      ...this.config$.value,
      page: this.pagination.PAGE,
      limit: this.pagination.LIMIT,
    })
    this.data$ = this.loadClientsObservable()
  }

  public onChangeLimit(limit: number): void {
    this.config$.next({
      ...this.config$.value,
      limit,
      page: this.pagination.PAGE,
    })
    this.data$ = this.loadClientsObservable()
  }

  public onChangePage(page: number): void {
    this.config$.next({ ...this.config$.value, page })
    this.data$ = this.loadClientsObservable()
  }

  public onSaved(): void {
    this.data$ = this.loadClientsObservable()
  }

  public openCreateModal(): void {
    const modalRef = this._modalService.open(ClientModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    })

    modalRef.componentInstance.mode = 'create'
    modalRef.componentInstance.allowPatientSelection = true

    modalRef.result.then(
      (result?: Client) => {
        if (result?.id) {
          this.onSaved()
        }
      },
      () => {}
    )
  }

  public openEditModal(client: Client): void {
    const modalRef = this._modalService.open(ClientModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    })

    modalRef.componentInstance.mode = 'edit'
    modalRef.componentInstance.client = client
    modalRef.componentInstance.patientId = client.patientId || null
    modalRef.componentInstance.allowPatientSelection = true

    modalRef.result.then(
      (result?: Client) => {
        if (result?.id) {
          this.onSaved()
        }
      },
      () => {}
    )
  }

  public openDetails(client: Client): void {
    const modalRef = this._modalService.open(ClientDetailsModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    })

    modalRef.componentInstance.client = client
  }

  public deleteClient(client: Client): void {
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: this._translate.instant('COMMON.WARNING'),
      text: this._translate.instant('CLIENT.DELETE_CONFIRMATION'),
      confirmButtonText: this._translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this._translate.instant('COMMON.CANCEL'),
    }).then((result) => {
      if (!result.isConfirmed) return

      this._clientsService.deleteGlobal(client.id).subscribe({
        next: () => {
          this._notificationService.showNotification({
            type: 'success',
            message: 'CLIENT.DELETED',
          })

          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            title: this._translate.instant('COMMON.DELETED'),
          })

          this.data$ = this.loadClientsObservable()
        },
        error: () => {
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: this._translate.instant('COMMON.ERROR'),
            text: this._translate.instant('COMMON.ERROR_OCCURRED'),
          })
        },
      })
    })
  }

  public getPatientLabel(client: Client): string {
    const totalPatients = client.patientIds?.length || client.patients?.length || 0

    if (!totalPatients) {
      return this._translate.instant('CLIENT.WITHOUT_PATIENT_LINK')
    }

    if (totalPatients > 1) {
      return `${totalPatients} ${this._translate.instant('PATIENT.TITLE')}`
    }

    const linkedPatient = client.patients?.[0] || client.patient
    const firstName = linkedPatient?.firstName || ''
    const lastName = linkedPatient?.lastName || ''
    const fullName = `${firstName} ${lastName}`.trim()

    if (fullName) {
      return fullName
    }

    return this._translate.instant('CLIENT.HAS_PATIENT_LINK')
  }

  private sanitizeFilter(filter: ClientQueryParams): ClientQueryParams {
    return {
      firstName: filter.firstName,
      lastName: filter.lastName,
      email: filter.email,
      documentNumber: filter.documentNumber,
      hasPatientLink: filter.hasPatientLink,
      patientId: filter.patientId,
    }
  }
}
