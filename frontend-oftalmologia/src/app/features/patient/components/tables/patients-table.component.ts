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
import Swal from 'sweetalert2'
import {
  SWAL_DELETE_CONFIRM_CONFIG,
  SWAL_SUCCESS_CONFIG,
  SWAL_ERROR_CONFIG,
} from '@core/helpers/ui/ui.constants'
import { BUTTON_ACTIONS } from '@core/helpers/ui/constants'
import { DEFAULT_NGX_DATATABLE_PAGINATION } from '@core/helpers/ui/ngx-datatable.constant'
import { FORMAT_FOR_DATES } from '@core/helpers/ui/ui.constants'
import { Patient } from '@core/interfaces/api/patient.interface'
import { ClinicalHistory } from '@core/interfaces/api/clinical-history.interface'
import {
  BootstrapModalConfig,
  ModalWithAction,
} from '@core/interfaces/ui/bootstrap-modal.interface'
import { NgxDatatableConfig } from '@core/interfaces/ui/ngx-datatable.interface'
import { ButtonAction } from '@core/interfaces/ui/ui.interface'
import { PatientService } from '@core/services/api/patient.service'
import { ClinicalHistoriesService } from '@core/services/api/clinical-histories.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { selectSelectedBranchId } from '@core/states/branch/branch.selectors'
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { ActivatedRoute, Router } from '@angular/router'
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  Observable,
  of,
  Subject,
  takeUntil,
  tap,
} from 'rxjs'
import { PageTitleComponent } from '../../../../shared/components/layouts/page-title/page-title.component'
import { NgxDatatableComponent } from '../../../../shared/components/tables/ngx-datatabale/ngx-datatable.component'
import {
  SideFilterPanelComponent,
  FilterValue,
} from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { PatientFilterComponent } from '../filter/patient-filter.component'
import { PatientFormModalComponent } from '../forms/patient-form-modal.component'
import { PatientDetailsModalComponent } from '../modals/patient-details-modal.component'
import { ClinicalHistoryUpsertModalComponent } from '../../../medical-history/components/modals/clinical-history-upsert-modal.component'
import { Client } from '@core/interfaces/api/client.interface'
import { ClientModalComponent } from '../../../laboratoy-orders/components/modals/client-modal/client-modal.component'
import { TableExportButtonsComponent } from '../../../../shared/components/table-export-buttons/table-export-buttons.component'
import { ExportColumn } from '@core/services/ui/table-export.service'
import { TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-patients-table',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PageTitleComponent,
    NgbModule,
    NgxDatatableComponent,
    SideFilterPanelComponent,
    TableExportButtonsComponent,
  ],
  templateUrl: './patients-table.component.html',
  styleUrls: ['./patients-table.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PatientsTableComponent implements OnInit, OnDestroy {
  public BUTTON_ACTIONS = BUTTON_ACTIONS
  public FORMAT_FOR_DATES = FORMAT_FOR_DATES
  private PAGINATION = DEFAULT_NGX_DATATABLE_PAGINATION

  public sideFilterComponent = PatientFilterComponent

  @ViewChild('createdAt', { static: true })
  public createdAtTemplate?: TemplateRef<HTMLElement>
  @ViewChild('statusTemplate', { static: true })
  public statusTemplate?: TemplateRef<HTMLElement>
  @ViewChild('branchTemplate', { static: true })
  public branchTemplate?: TemplateRef<HTMLElement>
  @ViewChild('companyTemplate', { static: true })
  public companyTemplate?: TemplateRef<HTMLElement>
  @ViewChild('actionsTemplate', { static: true })
  public actionsTemplate?: TemplateRef<HTMLElement>
  @ViewChild('sideFilterPanel', { static: false })
  public sideFilterPanel?: SideFilterPanelComponent

  public config$ = new BehaviorSubject<Partial<NgxDatatableConfig>>({})
  public data$: Observable<Patient[]> = of([])
  public medicalHistoryLoadingIds = new Set<string>()
  public medicalHistoryCache = new Map<string, ClinicalHistory | null>()
  public latestRows: Patient[] = []
  public exportColumns: ExportColumn<Patient>[] = []

  private filter: object = {}
  private unsubscribe$: Subject<boolean> = new Subject<boolean>()
  private hasInitializedBranchSubscription = false

  private _filterCommunicationService = inject(FilterCommunicationService)
  private _patientService = inject(PatientService)
  private _clinicalHistoriesService = inject(ClinicalHistoriesService)
  private _bsModalService = inject(BootstrapModalService)
  private _modal = inject(NgbModal)
  private _store = inject(Store<AppState>)
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _translateService = inject(TranslateService)

  ngOnInit(): void {
    this.suscribeToFilter()
    this.subscribeToBranchChanges()
    this.subscribeToOpenModalFromQueryParams()
    this.config$ = this.setConfigDatatable()
    this.exportColumns = this.buildExportColumns()
    this.reloadDatatable()
  }

  private buildExportColumns(): ExportColumn<Patient>[] {
    const translate = this._translateService
    return [
      { label: translate.instant('PATIENT.TABLE.LAST_NAME'), key: 'lastName' },
      { label: translate.instant('PATIENT.TABLE.FIRST_NAME'), key: 'firstName' },
      {
        label: translate.instant('PATIENT.TABLE.DOCUMENT_NUMBER'),
        key: 'documentNumber',
      },
      { label: translate.instant('PATIENT.TABLE.EMAIL'), key: 'email' },
      {
        label: translate.instant('PATIENT.TABLE.MOBILE_PHONE'),
        key: 'mobilePhone',
      },
      { label: translate.instant('PATIENT.TABLE.ADDRESS'), key: 'address' },
      {
        label: translate.instant('PATIENT.TABLE.BRANCH'),
        formatter: (row) => row.branch?.name || '-',
      },
      {
        label: translate.instant('PATIENT.TABLE.STATUS'),
        formatter: (row) =>
          translate.instant(
            row.isActive ? 'PATIENT.STATUS.ACTIVE' : 'PATIENT.STATUS.INACTIVE'
          ),
      },
      {
        label: translate.instant('PATIENT.TABLE.CREATED_AT'),
        formatter: (row) => this.formatDate(row.createdAt),
      },
    ]
  }

  private formatDate(value?: string | Date | null): string {
    if (!value) {
      return '-'
    }
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '-'
    }
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(true)
    this.unsubscribe$.unsubscribe()
  }

  private suscribeToFilter(): void {
    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (filter) => {
          this.filter = filter || {}
          this.reloadDatatable(this.filter)
        },
        error: (err) => {},
      })
  }

  private subscribeToBranchChanges(): void {
    this._store
      .select(selectSelectedBranchId)
      .pipe(
        takeUntil(this.unsubscribe$),
        distinctUntilChanged(),
        debounceTime(300)
      )
      .subscribe({
        next: () => {
          if (!this.hasInitializedBranchSubscription) {
            this.hasInitializedBranchSubscription = true
            return
          }

          this.reloadDatatable(this.filter)
        },
        error: () => {},
      })
  }

  private setConfigDatatable(): BehaviorSubject<Partial<NgxDatatableConfig>> {
    return new BehaviorSubject<Partial<NgxDatatableConfig>>({
      limit: this.PAGINATION.LIMIT,
      page: this.PAGINATION.PAGE,
      columns: [
        {
          name: 'PATIENT.TABLE.LAST_NAME',
          prop: 'lastName',
          width: 150,
          isPrimary: true,
        },
        {
          name: 'PATIENT.TABLE.FIRST_NAME',
          prop: 'firstName',
          width: 150,
          isPrimary: true,
        },
        {
          name: 'PATIENT.TABLE.DOCUMENT_NUMBER',
          prop: 'documentNumber',
          width: 140,
        },
        {
          name: 'PATIENT.TABLE.EMAIL',
          width: 200,
          prop: 'email',
        },
        {
          name: 'PATIENT.TABLE.MOBILE_PHONE',
          prop: 'mobilePhone',
          width: 130,
        },
        {
          name: 'PATIENT.TABLE.ADDRESS',
          prop: 'address',
          width: 180,
          hideOnMobile: true,
        },
        {
          name: 'PATIENT.TABLE.BRANCH',
          cellTemplate: this.branchTemplate ?? undefined,
          width: 120,
          sortable: false,
        },
        {
          name: 'PATIENT.TABLE.STATUS',
          cellTemplate: this.statusTemplate ?? undefined,
          width: 100,
          sortable: false,
        },
        {
          name: 'PATIENT.TABLE.CREATED_AT',
          cellTemplate: this.createdAtTemplate ?? undefined,
          width: 130,
          hideOnMobile: true,
        },
        {
          name: 'PATIENT.TABLE.ACTIONS',
          cellTemplate: this.actionsTemplate ?? undefined,
          width: 280,
          sortable: false,
          isActions: true,
        },
      ],
    })
  }

  private fetchPatients(filter: object): Observable<Patient[]> {
    this.config$.next({ ...this.config$.value, loadingIndicator: true })

    const updatedFilter = {
      ...filter,
      limit: this.config$.value.limit,
      page: this.config$.value.page,
    }

    return this._patientService.findPatients(updatedFilter).pipe(
      tap((res) => {
        const patients = res.data.result || []
        this.prefetchMedicalHistoryStatus(patients)
        this.latestRows = patients

        this.config$.next({
          ...this.config$.value,
          loadingIndicator: false,
          count: res.data.totalCount,
        })
      }),
      map((res) => res.data.result || []),
      catchError((err) => {
        this.config$.next({ ...this.config$.value, loadingIndicator: false })
        return of([])
      })
    )
  }

  public reloadDatatable(filter: object = {}): void {
    this.filter = filter
    this.config$.next({
      ...this.config$.value,
      limit: this.PAGINATION.LIMIT,
      page: this.PAGINATION.PAGE,
    })
    this.data$ = this.fetchPatients(this.filter)
  }

  public onChangeLimit(limit: number): void {
    this.config$.next({
      ...this.config$.value,
      limit,
      page: this.PAGINATION.PAGE,
    })
    this.data$ = this.fetchPatients(this.filter)
  }

  public onChangePage(page: number): void {
    this.config$.next({ ...this.config$.value, page })
    this.data$ = this.fetchPatients(this.filter)
  }

  public openModal(buttonAction: ButtonAction, patient?: Patient): void {
    if (buttonAction === BUTTON_ACTIONS.ADD) {
      const modalConfig: BootstrapModalConfig<ModalWithAction<Patient>> = {
        component: PatientFormModalComponent,
        options: {
          size: 'xl',
          backdrop: 'static',
          centered: true,
          windowClass: 'modal-lg modal-dialog-centered',
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

    if (buttonAction === BUTTON_ACTIONS.VIEW && patient) {
      const modalConfig: BootstrapModalConfig<ModalWithAction<Patient>> = {
        component: PatientDetailsModalComponent,
        options: {
          size: 'lg',
          backdrop: 'static',
          centered: true,
          windowClass: 'modal-lg modal-dialog-centered',
        },
        data: {
          buttonAction: BUTTON_ACTIONS.VIEW,
          selectedRow: patient,
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

    if (buttonAction === BUTTON_ACTIONS.EDIT && patient) {
      const modalConfig: BootstrapModalConfig<ModalWithAction<Patient>> = {
        component: PatientFormModalComponent,
        options: {
          size: 'xl',
          backdrop: 'static',
          centered: true,
          windowClass: 'modal-lg modal-dialog-centered',
        },
        data: {
          buttonAction: BUTTON_ACTIONS.EDIT,
          selectedRow: patient,
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

  private subscribeToOpenModalFromQueryParams(): void {
    this._route.queryParamMap.pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (queryParams) => {
        if (queryParams.get('openPatientModal') !== 'create') {
          return
        }

        this.openModal(BUTTON_ACTIONS.ADD)
        this.clearOpenModalQueryParams()
      },
      error: () => {},
    })
  }

  private clearOpenModalQueryParams(): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      replaceUrl: true,
      queryParams: {
        openPatientModal: null,
        modalTs: null,
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

  public deletePatient(patient: Patient): void {
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: '¿Eliminar paciente?',
      text: `¿Está seguro que desea eliminar al paciente ${patient.lastName} ${patient.firstName}? Esta acción no se puede deshacer.`,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.executeDeletePatient(patient, false)
      }
    })
  }

  public openCreateClientModal(patient: Patient): void {
    if (!patient?.id) {
      return
    }

    const modalRef = this._modal.open(ClientModalComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    })

    modalRef.componentInstance.mode = 'create'
    modalRef.componentInstance.patientId = patient.id

    modalRef.result
      .then((createdClient?: Client) => {
        if (createdClient?.id) {
          this.reloadDatatable(this.filter)
        }
      })
      .catch(() => {})
  }

  private executeDeletePatient(
    patient: Patient,
    deleteAssociatedClients: boolean
  ): void {
    this._patientService
      .deletePatient(patient.id, deleteAssociatedClients)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          const deletedClientsCount = Number(
            (response as any)?.data?.deletedClientsCount || 0
          )

          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            title: '¡Eliminado!',
            text:
              deletedClientsCount > 0
                ? `El paciente y ${deletedClientsCount} cliente${
                    deletedClientsCount > 1 ? 's' : ''
                  } asociado${
                    deletedClientsCount > 1 ? 's' : ''
                  } fueron eliminados correctamente.`
                : 'El paciente ha sido eliminado correctamente.',
          })
          this.reloadDatatable(this.filter)
        },
        error: (error) => {
          const requiresClientConfirmation =
            this.requiresClientDeletionConfirmation(error)

          if (!deleteAssociatedClients && requiresClientConfirmation) {
            const associatedClientsCount =
              this.getAssociatedClientsCount(error) || 0

            Swal.fire({
              ...SWAL_DELETE_CONFIRM_CONFIG,
              title: 'Paciente con clientes asociados',
              text: `Este paciente tiene ${associatedClientsCount} cliente${
                associatedClientsCount > 1 ? 's' : ''
              } asociado${
                associatedClientsCount > 1 ? 's' : ''
              }. ¿Desea eliminar también los clientes asociados?`,
              confirmButtonText: 'Sí, eliminar todo',
              cancelButtonText: 'Cancelar',
            }).then((result: any) => {
              if (result.isConfirmed) {
                this.executeDeletePatient(patient, true)
              }
            })

            return
          }

          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: 'Error',
            text:
              this.getLocalizedErrorMessage(error) ||
              'No se pudo eliminar el paciente. Intente nuevamente.',
          })
        },
      })
  }

  private requiresClientDeletionConfirmation(error: any): boolean {
    const payload = error?.error
    return !!payload?.data?.requiresClientDeletionConfirmation
  }

  private getAssociatedClientsCount(error: any): number | null {
    const count = error?.error?.data?.associatedClientsCount
    if (count === null || count === undefined) {
      return null
    }

    return Number(count)
  }

  private getLocalizedErrorMessage(error: any): string | null {
    const message = error?.error?.message

    if (!message) {
      return null
    }

    if (typeof message === 'string') {
      return message
    }

    if (typeof message === 'object') {
      return message.es || message.en || null
    }

    return null
  }

  public manageMedicalHistory(patient: Patient): void {
    if (!patient.id || this.medicalHistoryLoadingIds.has(patient.id)) {
      return
    }

    this.medicalHistoryLoadingIds.add(patient.id)

    this._clinicalHistoriesService
      .getByPatient(patient.id)
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => {
          this.medicalHistoryLoadingIds.delete(patient.id)
        })
      )
      .subscribe({
        next: (clinicalHistories: ClinicalHistory[]) => {
          if (clinicalHistories.length > 0) {
            this.medicalHistoryCache.set(patient.id, clinicalHistories[0])
            this.openEditMedicalHistoryModal(clinicalHistories[0])
            return
          }

          this.medicalHistoryCache.set(patient.id, null)
          this.openCreateMedicalHistoryModal(patient.id)
        },
        error: (err) => {},
      })
  }

  public isMedicalHistoryLoading(patientId: string): boolean {
    return this.medicalHistoryLoadingIds.has(patientId)
  }

  public getMedicalHistoryTooltip(patientId: string): string {
    if (!this.medicalHistoryCache.has(patientId)) {
      return 'Historial clínico'
    }
    return this.medicalHistoryCache.get(patientId) !== null
      ? 'Editar historial clínico'
      : 'Crear historial clínico'
  }

  public patientHasHistory(patientId: string): boolean | null {
    if (!this.medicalHistoryCache.has(patientId)) return null
    return this.medicalHistoryCache.get(patientId) !== null
  }

  public canShowViewMedicalHistoryButton(patientId: string): boolean {
    return true
  }

  public viewMedicalHistory(patient: Patient): void {
    if (!patient.id) {
      return
    }

    this._router.navigate(['/medical-history'], {
      queryParams: {
        patientId: patient.id,
      },
    })
  }

  private prefetchMedicalHistoryStatus(patients: Patient[]): void {
    patients.forEach((patient) => {
      if (!patient.id) {
        return
      }

      if (
        this.medicalHistoryCache.has(patient.id) ||
        this.medicalHistoryLoadingIds.has(patient.id)
      ) {
        return
      }

      this.medicalHistoryLoadingIds.add(patient.id)

      this._clinicalHistoriesService
        .getByPatient(patient.id)
        .pipe(
          takeUntil(this.unsubscribe$),
          finalize(() => {
            this.medicalHistoryLoadingIds.delete(patient.id)
          })
        )
        .subscribe({
          next: (clinicalHistories: ClinicalHistory[]) => {
            this.medicalHistoryCache.set(
              patient.id,
              clinicalHistories.length > 0 ? clinicalHistories[0] : null
            )
          },
          error: () => {
            this.medicalHistoryCache.set(patient.id, null)
          },
        })
    })
  }

  private openCreateMedicalHistoryModal(patientId: string): void {
    const modalRef = this._modal.open(ClinicalHistoryUpsertModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    })

    modalRef.componentInstance.editMode = false
    modalRef.componentInstance.preSelectedPatientId = patientId

    modalRef.result
      .then((result) => {
        if (result === true) {
          this._clinicalHistoriesService
            .getByPatient(patientId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
              next: (clinicalHistories: ClinicalHistory[]) => {
                this.medicalHistoryCache.set(
                  patientId,
                  clinicalHistories.length > 0 ? clinicalHistories[0] : null
                )
              },
              error: () => {},
            })
        }
      })
      .catch(() => {})
  }

  private openEditMedicalHistoryModal(clinicalHistory: ClinicalHistory): void {
    const modalRef = this._modal.open(ClinicalHistoryUpsertModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    })

    modalRef.componentInstance.editMode = true
    modalRef.componentInstance.selectedRecord = clinicalHistory
    modalRef.componentInstance.recordId = clinicalHistory.id

    modalRef.result
      .then((result) => {
        if (result === true) {
          const patientId = clinicalHistory.patientId
          this._clinicalHistoriesService
            .getByPatient(patientId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
              next: (clinicalHistories: ClinicalHistory[]) => {
                this.medicalHistoryCache.set(
                  patientId,
                  clinicalHistories.length > 0 ? clinicalHistories[0] : null
                )
              },
              error: () => {},
            })
        }
      })
      .catch(() => {})
  }

}
