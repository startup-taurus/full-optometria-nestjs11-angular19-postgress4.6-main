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
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import {
  BehaviorSubject,
  catchError,
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

  private filter: object = {}
  private unsubscribe$: Subject<boolean> = new Subject<boolean>()

  private _filterCommunicationService = inject(FilterCommunicationService)
  private _patientService = inject(PatientService)
  private _clinicalHistoriesService = inject(ClinicalHistoriesService)
  private _bsModalService = inject(BootstrapModalService)
  private _modal = inject(NgbModal)

  ngOnInit(): void {
    this.suscribeToFilter()
    this.config$ = this.setConfigDatatable()
    this.reloadDatatable()
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

  private setConfigDatatable(): BehaviorSubject<Partial<NgxDatatableConfig>> {
    return new BehaviorSubject<Partial<NgxDatatableConfig>>({
      limit: this.PAGINATION.LIMIT,
      page: this.PAGINATION.PAGE,
      columns: [
        {
          name: 'PATIENT.TABLE.FIRST_NAME',
          prop: 'firstName',
          width: 150,
        },
        {
          name: 'PATIENT.TABLE.LAST_NAME',
          prop: 'lastName',
          width: 150,
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
        },
        {
          name: 'PATIENT.TABLE.ACTIONS',
          cellTemplate: this.actionsTemplate ?? undefined,
          width: 230,
          sortable: false,
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
      text: `¿Está seguro que desea eliminar al paciente ${patient.firstName} ${patient.lastName}? Esta acción no se puede deshacer.`,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result: any) => {
      if (result.isConfirmed) {
        this._patientService
          .deletePatient(patient.id)
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe({
            next: () => {
              Swal.fire({
                ...SWAL_SUCCESS_CONFIG,
                title: '¡Eliminado!',
                text: 'El paciente ha sido eliminado correctamente.',
              })
              this.reloadDatatable(this.filter)
            },
            error: (error) => {
              Swal.fire({
                ...SWAL_ERROR_CONFIG,
                title: 'Error',
                text: 'No se pudo eliminar el paciente. Intente nuevamente.',
              })
            },
          })
      }
    })
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

  private openCreateMedicalHistoryModal(patientId: string): void {
    const modalRef = this._modal.open(ClinicalHistoryUpsertModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    })

    modalRef.componentInstance.editMode = false
    modalRef.componentInstance.preSelectedPatientId = patientId

    modalRef.result.then(() => {}).catch(() => {})
  }

  private openEditMedicalHistoryModal(clinicalHistory: ClinicalHistory): void {
    const modalRef = this._modal.open(ClinicalHistoryUpsertModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    })

    modalRef.componentInstance.editMode = true
    modalRef.componentInstance.selectedRecord = clinicalHistory
    modalRef.componentInstance.recordId = clinicalHistory.id

    modalRef.result.then(() => {}).catch(() => {})
  }
}
