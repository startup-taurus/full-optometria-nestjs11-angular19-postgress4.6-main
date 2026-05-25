import { CommonModule } from '@angular/common'
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  inject,
  OnDestroy,
  OnInit,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core'
import { BUTTON_ACTIONS } from '@core/helpers/ui/constants'
import { DEFAULT_NGX_DATATABLE_PAGINATION } from '@core/helpers/ui/ngx-datatable.constant'
import { NgxDatatableConfig } from '@core/interfaces/ui/ngx-datatable.interface'
import { ButtonAction } from '@core/interfaces/ui/ui.interface'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { selectSelectedBranchId } from '@core/states/branch/branch.selectors'
import {
  BehaviorSubject,
  Observable,
  of,
  Subject,
  takeUntil,
  map,
  distinctUntilChanged,
  debounceTime,
} from 'rxjs'
import { PageTitleComponent } from '../../../../shared/components/layouts/page-title/page-title.component'
import { NgxDatatableComponent } from '../../../../shared/components/tables/ngx-datatabale/ngx-datatable.component'
import {
  SideFilterPanelComponent,
  FilterValue,
} from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { FilterMedicalHistoryComponent } from '../filters/filter-medical-history/filter-medical-history.component'
import { ClinicalHistoriesService } from '@core/services/api/clinical-histories.service'
import {
  ClinicalHistory,
  ClinicalHistoryQueryParams,
} from '@core/interfaces/api/clinical-history.interface'
import { ClinicalHistoryUpsertModalComponent } from '../modals/clinical-history-upsert-modal.component'
import { ViewMedicalHistoryComponent } from '../forms/view-medical-history/view-medical-history/view-medical-history.component'
import { LaboratoryOrderUpsertModalComponent } from '../../../laboratoy-orders/components/laboratory-order-upsert-modal/laboratory-order-upsert-modal.component'
import { LaboratoryOrdersService } from '@core/services/api/laboratory-orders.service'
import {
  LaboratoryOrder,
  LaboratoryOrderStatus,
} from '@core/interfaces/api/laboratory-order.interface'
import Swal from 'sweetalert2'
import { SWAL_DELETE_CONFIRM_CONFIG, SWAL_SUCCESS_CONFIG, SWAL_ERROR_CONFIG } from '@core/helpers/ui/ui.constants'

export interface MedicalHistoryRecord {
  id: string
  identification: string
  firstName: string
  lastName: string
  phone: string
  lastExamDate: string
  rightEyeAdd: string
  leftEyeAdd: string
  status: 'enviado' | 'pendiente' | 'cancelado'
  originalRecord: ClinicalHistory
}

@Component({
  selector: 'table-medical-history',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PageTitleComponent,
    NgbModule,
    NgxDatatableComponent,
    SideFilterPanelComponent,
  ],
  templateUrl: './table-medical-history.component.html',
  styleUrls: ['./table-medical-history.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableMedicalHistoryComponent implements OnInit, OnDestroy {
  public BUTTON_ACTIONS = BUTTON_ACTIONS
  private PAGINATION = DEFAULT_NGX_DATATABLE_PAGINATION

  public sideFilterComponent = FilterMedicalHistoryComponent
  @Input() patientId: string | null = null

  @ViewChild('statusTemplate', { static: true })
  public statusTemplate?: TemplateRef<HTMLElement>
  @ViewChild('actionsTemplate', { static: true })
  public actionsTemplate?: TemplateRef<HTMLElement>
  @ViewChild('sideFilterPanel', { static: false })
  public sideFilterPanel?: SideFilterPanelComponent

  public config$ = new BehaviorSubject<Partial<NgxDatatableConfig>>({})
  public data$: Observable<MedicalHistoryRecord[]> = of([])

  private filter: ClinicalHistoryQueryParams = {}
  private unsubscribe$: Subject<boolean> = new Subject<boolean>()
  private isInitialLoad = true
  private isReady = false

  private _filterCommunicationService = inject(FilterCommunicationService)
  private _clinicalHistoriesService = inject(ClinicalHistoriesService)
  private _laboratoryOrdersService = inject(LaboratoryOrdersService)
  private _modal = inject(NgbModal)
  private _store = inject(Store<AppState>)

  ngOnInit(): void {
    this.config$ = this.setConfigDatatable()
    this.isReady = true
    this.initializeSubscriptions()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isReady || !changes['patientId']) {
      return
    }

    this.reloadDatatable(this.filter)
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(true)
    this.unsubscribe$.unsubscribe()
  }

  private isSameFilter(
    current: ClinicalHistoryQueryParams,
    next: ClinicalHistoryQueryParams
  ): boolean {
    return JSON.stringify(current || {}) === JSON.stringify(next || {})
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
          this.reloadDatatable(this.filter)
        },
        error: (error) => {},
      })

    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (filter) => {
          if (this.isInitialLoad) {
            return
          }

          const nextFilter = (filter as ClinicalHistoryQueryParams) || {}

          if (this.isSameFilter(this.filter, nextFilter)) {
            return
          }

          this.filter = nextFilter
          this.reloadDatatable(this.filter)
        },
        error: (err) => {},
      })
  }

  private setConfigDatatable(): BehaviorSubject<Partial<NgxDatatableConfig>> {
    return new BehaviorSubject<Partial<NgxDatatableConfig>>({
      limit: this.PAGINATION.LIMIT,
      page: this.PAGINATION.PAGE,
      columns: [
        {
          name: 'MEDICAL_HISTORY.TABLE.IDENTIFICATION',
          prop: 'identification',
          width: 130,
          isPrimary: true,
        },
        {
          name: 'MEDICAL_HISTORY.TABLE.LAST_NAME',
          prop: 'lastName',
          width: 150,
          isPrimary: true,
        },
        {
          name: 'MEDICAL_HISTORY.TABLE.FIRST_NAME',
          prop: 'firstName',
          width: 150,
        },
        {
          name: 'MEDICAL_HISTORY.TABLE.PHONE',
          prop: 'phone',
          width: 140,
        },
        {
          name: 'MEDICAL_HISTORY.TABLE.LAST_EXAM_DATE',
          prop: 'lastExamDate',
          width: 130,
          hideOnMobile: true,
        },
        {
          name: 'MEDICAL_HISTORY.TABLE.OD_ADD',
          prop: 'rightEyeAdd',
          width: 100,
          hideOnMobile: true,
        },
        {
          name: 'MEDICAL_HISTORY.TABLE.OI_ADD',
          prop: 'leftEyeAdd',
          width: 100,
          hideOnMobile: true,
        },
        {
          name: 'MEDICAL_HISTORY.TABLE.STATUS',
          cellTemplate: this.statusTemplate ?? undefined,
          width: 120,
          sortable: false,
        },
        {
          name: 'MEDICAL_HISTORY.TABLE.ACTIONS',
          cellTemplate: this.actionsTemplate ?? undefined,
          width: 180,
          sortable: false,
          isActions: true,
        },
      ],
    })
  }

  private mapToTableRecord(
    clinicalHistory: ClinicalHistory
  ): MedicalHistoryRecord {
    return {
      id: clinicalHistory.id,
      identification: clinicalHistory.patient?.documentNumber || '',
      firstName: clinicalHistory.patient?.firstName || '',
      lastName: clinicalHistory.patient?.lastName || '',
      phone:
        clinicalHistory.patient?.mobilePhone ||
        clinicalHistory.patient?.homePhone ||
        '',
      lastExamDate: clinicalHistory.lastVisualExamDate
        ? new Date(clinicalHistory.lastVisualExamDate).toLocaleDateString(
            'es-EC'
          )
        : '',
      rightEyeAdd: clinicalHistory.finalRxOdAdd || '0.00',
      leftEyeAdd: clinicalHistory.finalRxOiAdd || '0.00',
      status: clinicalHistory.isSent ? 'enviado' : 'pendiente',
      originalRecord: clinicalHistory,
    }
  }

  public reloadDatatable(filter: ClinicalHistoryQueryParams = {}): void {
    this.filter = filter

    const queryParams: ClinicalHistoryQueryParams = {
      ...filter,
      ...(this.patientId ? { patientFilterId: this.patientId } : {}),
      page: this.config$.value.page || this.PAGINATION.PAGE,
      limit: this.config$.value.limit || this.PAGINATION.LIMIT,
    }

    this.config$.next({
      ...this.config$.value,
      loadingIndicator: true,
    })

    this.data$ = this._clinicalHistoriesService
      .getAllWithFilters(queryParams)
      .pipe(
        map(
          (response: {
            data: ClinicalHistory[]
            total: number
            page: number
            limit: number
          }) => {
            this.config$.next({
              ...this.config$.value,
              count: response.total,
              page: response.page,
              limit: response.limit,
              loadingIndicator: false,
            })

            return response.data.map((history: ClinicalHistory) =>
              this.mapToTableRecord(history)
            )
          }
        ),
        takeUntil(this.unsubscribe$)
      )

    this.isInitialLoad = false
  }

  public onChangeLimit(limit: number): void {
    this.config$.next({
      ...this.config$.value,
      limit,
      page: 1,
    })
    this.reloadDatatable(this.filter)
  }

  public onChangePage(page: number): void {
    this.config$.next({ ...this.config$.value, page })
    this.reloadDatatable(this.filter)
  }

  public openModal(
    buttonAction: ButtonAction,
    record?: MedicalHistoryRecord
  ): void {
    if (buttonAction === BUTTON_ACTIONS.ADD) {
      this.openUpsertModal(null, false, undefined, this.patientId || undefined)
    } else if (buttonAction === BUTTON_ACTIONS.EDIT && record) {
      this.openUpsertModal(null, false, record.originalRecord.id)
    } else if (buttonAction === BUTTON_ACTIONS.VIEW && record) {
      this.openViewModal(record.id)
    } else if (buttonAction === BUTTON_ACTIONS.DELETE && record) {
      this.confirmDeleteRecord(record)
    }
  }

  public duplicateRecord(record: MedicalHistoryRecord): void {
    this.openUpsertModal(
      record.originalRecord,
      false,
      undefined,
      record.originalRecord.patientId,
      true
    )
  }

  private openUpsertModal(
    clinicalHistory: Partial<ClinicalHistory> | null,
    isViewOnly: boolean = false,
    recordId?: string,
    preSelectedPatientId?: string,
    duplicateMode: boolean = false
  ): void {
    const modalRef = this._modal.open(ClinicalHistoryUpsertModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    })

    modalRef.componentInstance.editMode = !!recordId
    modalRef.componentInstance.selectedRecord =
      clinicalHistory as ClinicalHistory
    modalRef.componentInstance.recordId = recordId
    modalRef.componentInstance.preSelectedPatientId =
      preSelectedPatientId || undefined
    modalRef.componentInstance.duplicateMode = duplicateMode

    modalRef.result
      .then((result: any) => {
        if (result && !isViewOnly) {
          this.reloadDatatable(this.filter)
        }
      })
      .catch(() => {})
  }

  private openViewModal(clinicalHistoryId: string): void {
    const modalRef = this._modal.open(ViewMedicalHistoryComponent, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    })

    modalRef.componentInstance.clinicalHistoryId = clinicalHistoryId

    modalRef.result.then(() => {}).catch(() => {})
  }

  private mapRecordToClinicalHistory(
    record: MedicalHistoryRecord
  ): Partial<ClinicalHistory> {
    return {
      id: record.id,
      patientId: record.identification,
      finalRxOdAdd: record.rightEyeAdd,
      finalRxOiAdd: record.leftEyeAdd,
      isSent: record.status === 'enviado',
    }
  }

  public onSideFilterApplied(filters: FilterValue): void {
    const nextFilter = (filters as ClinicalHistoryQueryParams) || {}
    if (this.isSameFilter(this.filter, nextFilter)) {
      return
    }
    this.filter = nextFilter
    this.reloadDatatable(this.filter)
  }

  public onSideFilterCleared(): void {
    if (this.isSameFilter(this.filter, {})) {
      return
    }
    this.filter = {}
    this.reloadDatatable(this.filter)
  }

  public hasActiveFilters(): boolean {
    return Object.keys(this.filter).length > 0
  }

  public clearAllFilters(): void {
    this._filterCommunicationService.resetFilter()
    this.filter = {}
    this.reloadDatatable(this.filter)
  }

  private confirmDeleteRecord(record: MedicalHistoryRecord): void {
    const patientName = `${record.lastName} ${record.firstName}`
    
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar la historia clínica de "${patientName}"? Esta acción no se puede deshacer.`,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteRecord(record)
      }
    })
  }

  private deleteRecord(record: MedicalHistoryRecord): void {
    this._clinicalHistoriesService.delete(record.originalRecord.id).subscribe({
      next: () => {
        Swal.fire({
          ...SWAL_SUCCESS_CONFIG,
          title: '¡Eliminado!',
          text: 'La historia clínica ha sido eliminada exitosamente.',
        })
        this.reloadDatatable(this.filter)
      },
      error: (err) => {
        Swal.fire({
          ...SWAL_ERROR_CONFIG,
          title: 'Error',
          text: 'No se pudo eliminar la historia clínica. Por favor, intenta nuevamente.',
        })
      },
    })
  }

  // public sendRecord(record: MedicalHistoryRecord): void {
  //   if (record.originalRecord.id) {
  //     this._clinicalHistoriesService
  //       .changeStatus(record.originalRecord.id, true)
  //       .subscribe({
  //         next: () => {
  //           this.reloadDatatable(this.filter)
  //         },
  //         error: (error) => {},
  //       })
  //   }
  // }

  public createLaboratoryOrder(record: MedicalHistoryRecord): void {
    const clinicalHistoryId = record.originalRecord.id
    const patientFilterId = record.originalRecord.patientId

    this._laboratoryOrdersService
      .getAllWithFilters({
        page: 1,
        limit: 1000,
        ...(patientFilterId ? { patientFilterId } : {}),
      })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          const orders = response?.data || []
          const hasActiveOrder = this.hasActiveLaboratoryOrderForHistory(
            orders,
            clinicalHistoryId
          )

          if (hasActiveOrder) {
            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: 'Orden activa existente',
              text: 'Esta historia clínica ya tiene una orden de laboratorio activa. Si se cancela la orden actual, podrá crear una nueva.',
            })
            return
          }

          this.openLaboratoryOrderModal(clinicalHistoryId)
        },
        error: () => {
          this.openLaboratoryOrderModal(clinicalHistoryId)
        },
      })
  }

  private hasActiveLaboratoryOrderForHistory(
    orders: LaboratoryOrder[],
    clinicalHistoryId: string
  ): boolean {
    return orders.some((order) => {
      if (order.clinicalHistoryId !== clinicalHistoryId) {
        return false
      }

      return this.normalizeLaboratoryOrderStatus(order) !== LaboratoryOrderStatus.CANCELLED
    })
  }

  private normalizeLaboratoryOrderStatus(
    order: LaboratoryOrder
  ): LaboratoryOrderStatus {
    if (order.status) {
      return order.status
    }

    return order.isConfirmed
      ? LaboratoryOrderStatus.RECEIVED
      : LaboratoryOrderStatus.PENDING
  }

  private openLaboratoryOrderModal(clinicalHistoryId: string): void {
    const modalRef = this._modal.open(LaboratoryOrderUpsertModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    })

    modalRef.componentInstance.mode = 'create'
    modalRef.componentInstance.clinicalHistoryId = clinicalHistoryId

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.reloadDatatable(this.filter)
        }
      },
      () => {}
    )
  }
}
