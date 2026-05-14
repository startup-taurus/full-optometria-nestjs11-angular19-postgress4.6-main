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
import { User } from '@core/interfaces/api/user.interface'
import { PlanQuota } from '@core/interfaces/api/company.interface'
import {
  BootstrapModalConfig,
  ModalWithAction,
} from '@core/interfaces/ui/bootstrap-modal.interface'
import { NgxDatatableConfig } from '@core/interfaces/ui/ngx-datatable.interface'
import { ButtonAction } from '@core/interfaces/ui/ui.interface'
import { UserService } from '@core/services/api/user.service'
import { AuthenticationService } from '@core/services/api/auth.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'
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
} from 'rxjs'
import { PageTitleComponent } from '../../../../shared/components/layouts/page-title/page-title.component'
import { NgxDatatableComponent } from '../../../../shared/components/tables/ngx-datatabale/ngx-datatable.component'
import {
  SideFilterPanelComponent,
  FilterValue,
} from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { UserFilterComponent } from '../filter/user-filter.component'
import { UserFormModalComponent } from '../forms/user-form-modal.component'
import { UserDetailsModalComponent } from '../modals/user-details-modal.component'

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PageTitleComponent,
    NgbModule,
    NgxDatatableComponent,
    SideFilterPanelComponent,
  ],
  templateUrl: './users-table.component.html',
  styleUrls: ['./users-table.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class UsersTableComponent implements OnInit, OnDestroy {
  public BUTTON_ACTIONS = BUTTON_ACTIONS
  public FORMAT_FOR_DATES = FORMAT_FOR_DATES
  private PAGINATION = DEFAULT_NGX_DATATABLE_PAGINATION
  public quota: PlanQuota | null = null

  public sideFilterComponent = UserFilterComponent

  @ViewChild('createdAt', { static: true })
  public createdAtTemplate?: TemplateRef<HTMLElement>
  @ViewChild('lastLoginAt', { static: true })
  public lastLoginAtTemplate?: TemplateRef<HTMLElement>
  @ViewChild('statusTemplate', { static: true })
  public statusTemplate?: TemplateRef<HTMLElement>
  @ViewChild('roleTemplate', { static: true })
  public roleTemplate?: TemplateRef<HTMLElement>
  @ViewChild('branchTemplate', { static: true })
  public branchTemplate?: TemplateRef<HTMLElement>
  @ViewChild('companyTemplate', { static: true })
  public companyTemplate?: TemplateRef<HTMLElement>
  @ViewChild('actionsTemplate', { static: true })
  public actionsTemplate?: TemplateRef<HTMLElement>
  @ViewChild('sideFilterPanel', { static: false })
  public sideFilterPanel?: SideFilterPanelComponent

  public config$ = new BehaviorSubject<Partial<NgxDatatableConfig>>({})
  public data$: Observable<User[]> = of([])

  private filter: object = {}
  private unsubscribe$: Subject<boolean> = new Subject<boolean>()

  private _filterCommunicationService = inject(FilterCommunicationService)
  private _userService = inject(UserService)
  private _authService = inject(AuthenticationService)
  private _bsModalService = inject(BootstrapModalService)

  ngOnInit(): void {
    this.suscribeToFilter()
    this.config$ = this.setConfigDatatable()
    this.reloadDatatable()
    this.loadQuota()
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(true)
    this.unsubscribe$.unsubscribe()
  }

  private loadQuota(): void {
    this._authService.getMyQuota()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (res) => { this.quota = res.data ?? null },
        error: (err) => { console.error('[Users] quota error:', err) },
      })
  }

  public refreshQuota(): void {
    this._authService.invalidateMyQuotaCache()
    this._authService.getMyQuota()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (res) => { this.quota = res.data ?? null },
        error: () => {},
      })
  }

  public getUsersUsed(): number {
    return this.quota?.usersCount ?? 0
  }

  public getUsersLimit(): number | null {
    return this.quota?.maxUsers ?? null
  }

  public getUsersLimitLabel(): string {
    const limit = this.getUsersLimit()
    return limit === null ? '∞' : String(limit)
  }

  public getUsersUsagePercent(): number {
    const limit = this.getUsersLimit()
    if (!limit || limit <= 0) {
      return 0
    }

    return Math.min(100, Math.round((this.getUsersUsed() / limit) * 100))
  }

  public getUsersRemainingLabel(): string {
    const limit = this.getUsersLimit()
    if (limit === null) {
      return 'Sin límite'
    }

    return `${Math.max(limit - this.getUsersUsed(), 0)} libres`
  }

  public getUsersBadgeClass(): string {
    const limit = this.getUsersLimit()
    if (limit === null) {
      return 'bg-primary'
    }

    return this.getUsersUsed() >= limit ? 'bg-danger' : 'bg-success'
  }

  public getUsersProgressClass(): string {
    const limit = this.getUsersLimit()
    if (limit === null) {
      return 'bg-primary'
    }

    return this.getUsersUsed() >= limit ? 'bg-danger' : 'bg-success'
  }

  public getUsersQuotaTooltip(): string {
    const limit = this.getUsersLimit()
    if (limit === null) {
      return `Tienes ${this.getUsersUsed()} usuarios registrados. Tu plan no tiene límite de usuarios.`
    }

    const remaining = Math.max(limit - this.getUsersUsed(), 0)
    if (remaining === 0) {
      return `Has usado ${this.getUsersUsed()} de ${limit} usuarios. Ya llegaste al límite y debes ampliar tu plan para crear más.`
    }

    return `Has usado ${this.getUsersUsed()} de ${limit} usuarios. Te quedan ${remaining} disponibles para crear.`
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
          name: 'USER.TABLE.USERNAME',
          prop: 'username',
          width: 120,
        },
        {
          name: 'USER.TABLE.FIRST_NAME',
          prop: 'firstName',
          width: 130,
        },
        {
          name: 'USER.TABLE.LAST_NAME',
          prop: 'lastName',
          width: 130,
        },
        {
          name: 'USER.TABLE.EMAIL',
          width: 200,
          prop: 'email',
        },
        {
          name: 'USER.TABLE.DOCUMENT_NUMBER',
          prop: 'documentNumber',
          width: 140,
        },
        {
          name: 'USER.TABLE.MOBILE_PHONE',
          prop: 'mobilePhone',
          width: 130,
        },
        {
          name: 'USER.TABLE.ROLE',
          cellTemplate: this.roleTemplate ?? undefined,
          width: 120,
          sortable: false,
        },
        {
          name: 'USER.TABLE.BRANCH',
          cellTemplate: this.branchTemplate ?? undefined,
          width: 120,
          sortable: false,
        },
        {
          name: 'USER.TABLE.COMPANY',
          cellTemplate: this.companyTemplate ?? undefined,
          width: 150,
          sortable: false,
        },
        {
          name: 'USER.TABLE.STATUS',
          cellTemplate: this.statusTemplate ?? undefined,
          width: 100,
          sortable: false,
        },
        {
          name: 'USER.TABLE.IS_LOCKED',
          prop: 'isLocked',
          width: 100,
        },
        {
          name: 'USER.TABLE.LAST_LOGIN',
          cellTemplate: this.lastLoginAtTemplate ?? undefined,
          width: 150,
        },
        {
          name: 'USER.TABLE.CREATED_AT',
          cellTemplate: this.createdAtTemplate ?? undefined,
          width: 130,
        },
        {
          name: 'USER.TABLE.ACTIONS',
          cellTemplate: this.actionsTemplate ?? undefined,
          width: 190,
          sortable: false,
        },
      ],
    })
  }

  private fetchUsers(filter: object): Observable<User[]> {
    this.config$.next({ ...this.config$.value, loadingIndicator: true })

    const updatedFilter = {
      ...filter,
      limit: this.config$.value.limit,
      page: this.config$.value.page,
    }

    return this._userService.findUsers(updatedFilter).pipe(
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
    this.data$ = this.fetchUsers(this.filter)
    this.refreshQuota()
  }

  public onChangeLimit(limit: number): void {
    this.config$.next({
      ...this.config$.value,
      limit,
      page: this.PAGINATION.PAGE,
    })
    this.data$ = this.fetchUsers(this.filter)
  }

  public onChangePage(page: number): void {
    this.config$.next({ ...this.config$.value, page })
    this.data$ = this.fetchUsers(this.filter)
  }

  public openModal(buttonAction: ButtonAction, user?: User): void {
    if (buttonAction === BUTTON_ACTIONS.ADD) {
      const modalConfig: BootstrapModalConfig<ModalWithAction<User>> = {
        component: UserFormModalComponent,
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

    if (buttonAction === BUTTON_ACTIONS.VIEW && user) {
      const modalConfig: BootstrapModalConfig<ModalWithAction<User>> = {
        component: UserDetailsModalComponent,
        options: {
          size: 'lg',
          backdrop: 'static',
          centered: true,
          windowClass: 'modal-lg modal-dialog-centered',
        },
        data: {
          buttonAction: BUTTON_ACTIONS.VIEW,
          selectedRow: user,
        },
      }

      const modalRef = this._bsModalService.openModal(modalConfig)
    }

    if (buttonAction === BUTTON_ACTIONS.EDIT && user) {
      const modalConfig: BootstrapModalConfig<ModalWithAction<User>> = {
        component: UserFormModalComponent,
        options: {
          size: 'xl',
          backdrop: 'static',
          centered: true,
          windowClass: 'modal-lg modal-dialog-centered',
        },
        data: {
          buttonAction: BUTTON_ACTIONS.EDIT,
          selectedRow: user,
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

  public deleteUser(user: User): void {
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: '¿Eliminar usuario?',
      text: `¿Está seguro que desea eliminar al usuario ${user.username}? Esta acción no se puede deshacer.`,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result: any) => {
      if (result.isConfirmed) {
        this._userService
          .deleteUser(user.id)
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe({
            next: () => {
              Swal.fire({
                ...SWAL_SUCCESS_CONFIG,
                title: '¡Eliminado!',
                text: 'El usuario ha sido eliminado correctamente.',
              })
              this.reloadDatatable(this.filter)
            },
            error: (error) => {
              Swal.fire({
                ...SWAL_ERROR_CONFIG,
                title: 'Error',
                text: 'No se pudo eliminar el usuario. Intente nuevamente.',
              })
            },
          })
      }
    })
  }
}
