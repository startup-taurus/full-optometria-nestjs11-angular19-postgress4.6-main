import { CommonModule } from '@angular/common'
import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MODAL_TYPE } from '@core/helpers/global/global.constants'
import { Permission } from '@core/interfaces/api/permission.interface'
import { PermissionService } from '@core/services/api/permission.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { SelectionService } from '@core/services/ui/selection.service'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs'
import { PermissionsService } from '@core/services/api/permissions.service'
import { PermissionFormComponent } from '../../forms/permission-form/permission-form.component'

@Component({
  selector: 'permission-rigth-side-bar',
  standalone: true,
  imports: [CommonModule, TranslateModule, NgbModule, FormsModule],
  templateUrl: './permission-rigth-side-bar.component.html',
  styleUrl: './permission-rigth-side-bar.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PermissionRigthSideBarComponent implements OnInit, OnDestroy {
  public permissions$: BehaviorSubject<Permission[]> = new BehaviorSubject<
    Permission[]
  >([])
  public searchTerm: string = ''
  public isLoading: boolean = false
  public selectedModuleId: string | null = null
  public selectedRoleId: string | null = null
  public currentPage: number = 1
  public pageSize: number = 100
  public isSuperAdmin: boolean = false

  private searchSubject = new Subject<string>()
  private destroy$ = new Subject<void>()

  private _permissionsService = inject(PermissionService)
  private _selectionService = inject(SelectionService)
  private _bootstrapModalService = inject(BootstrapModalService)
  private _permissions = inject(PermissionsService)

  ngOnInit(): void {
    this.isSuperAdmin = this._permissions.isSuperAdmin()
    this.initializeSubscriptions()
  }

  private initializeSubscriptions(): void {
    this._bootstrapModalService.getModalClosed().subscribe(() => {
      this._bootstrapModalService.getDataIssued().subscribe((data) => {
        if (data?.modalType === MODAL_TYPE.PERMISSION_FORM) {
          this.loadPermissionsByModule()
        }
      })
    })
    this._selectionService.selectedRoleId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((roleId) => {
        this.selectedRoleId = roleId
        this.permissions$.next([])
      })

    this._selectionService.selectedModuleId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((moduleId) => {
        this.selectedModuleId = moduleId

        if (moduleId) {
          this.loadPermissionsByModule()
        } else {
          this.permissions$.next([])
        }
      })

    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((term) =>
          this._permissionsService.getPermissionsByRoleAndModule(
            this.selectedRoleId!,
            this.selectedModuleId!,
            term,
            this.currentPage,
            this.pageSize
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        if (response.data && response.data.result) {
          this.permissions$.next(response.data.result)
        } else {
          this.permissions$.next([])
        }
      })
  }

  private loadPermissionsByModule(): void {
    if (!this.selectedRoleId || !this.selectedModuleId) return

    this.isLoading = true

    this._permissionsService
      .getPermissionsByRoleAndModule(
        this.selectedRoleId,
        this.selectedModuleId,
        this.searchTerm,
        this.currentPage,
        this.pageSize
      )
      .pipe(
        tap((response) => {
          this.isLoading = false
          if (response.data && response.data.result) {
            this.permissions$.next(response.data.result)
          } else {
            this.permissions$.next([])
          }
        }),
        catchError(() => {
          this.isLoading = false
          this.permissions$.next([])
          return of([])
        })
      )
      .subscribe()
  }

  public selectModule(moduleId: string): void {
    this.selectedModuleId = moduleId
    this._selectionService.setModuleId(moduleId)
  }

  public onSearchInput(): void {
    this.searchSubject.next(this.searchTerm)
  }

  public searchPermissions(): void {
    this.isLoading = true
    this._permissionsService
      .getPermissionsByRoleAndModule(
        this.selectedRoleId!,
        this.selectedModuleId!,
        this.searchTerm,
        this.currentPage,
        this.pageSize
      )
      .subscribe((response) => {
        this.isLoading = false
        if (response.data && response.data.result) {
          this.permissions$.next(response.data.result)
        } else {
          this.permissions$.next([])
        }
      })
  }

  public togglePermissionStatus(permissionId: string, event?: Event): void {
    if (event) {
      event.stopPropagation()
    }

    if (!this.selectedRoleId) return

    const currentPermissions = this.permissions$.value
    const permission = currentPermissions.find((p) => p.id === permissionId)

    if (!permission) return

    const currentStatus = permission.isActiveForRole || false
    this.isLoading = true

    this._permissionsService
      .togglePermissionStatus(this.selectedRoleId, permissionId, currentStatus)
      .pipe(
        tap(() => {
          const updatedPermissions = currentPermissions.map((p) =>
            p.id === permissionId
              ? {
                  ...p,
                  isActiveForRole: !currentStatus,
                }
              : p
          )
          this.permissions$.next(updatedPermissions)
        }),
        catchError(() => {
          console.error('⚠️ Error al cambiar estado del permiso:')
          return of([])
        })
      )
      .subscribe(() => {
        this.isLoading = false
      })
  }

  public openEditModal(permissionId: string, event: Event): void {
    event.stopPropagation()
    this._bootstrapModalService.openModal({
      component: PermissionFormComponent,
      data: { permissionId, modalType: MODAL_TYPE.PERMISSION_FORM },
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
