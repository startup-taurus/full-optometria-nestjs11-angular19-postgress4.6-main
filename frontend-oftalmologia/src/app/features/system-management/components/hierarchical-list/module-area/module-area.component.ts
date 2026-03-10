import { CommonModule } from '@angular/common'
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
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
import { Module } from '@core/interfaces/api/module.interface'
import { ModuleService } from '@core/services/api/module.service'
import { SelectionService } from '@core/services/ui/selection.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { ModuleFormComponent } from '../../forms/module-form/module-form.component'
import { MODAL_TYPE } from '@core/helpers/global/global.constants'
import { PermissionFormComponent } from '../../forms/permission-form/permission-form.component'
import { PermissionsService } from '@core/services/api/permissions.service'

@Component({
  selector: 'module-area',
  standalone: true,
  imports: [CommonModule, TranslateModule, NgbModule, FormsModule],
  templateUrl: './module-area.component.html',
  styleUrl: './module-area.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ModuleAreaComponent implements OnInit, OnDestroy {
  public modules$: BehaviorSubject<Module[]> = new BehaviorSubject<Module[]>([])
  public searchTerm: string = ''
  public isLoading: boolean = false
  public selectedRoleId: string | null = null
  public selectedModuleId: string | null = null
  public isSuperAdmin: boolean = false
  private readonly pageSize = 100

  private searchSubject = new Subject<string>()
  private destroy$ = new Subject<void>()

  private _moduleService = inject(ModuleService)
  private _selectionService = inject(SelectionService)
  private _bootstrapModalService = inject(BootstrapModalService)
  private _permissionsService = inject(PermissionsService)

  ngOnInit(): void {
    this.isSuperAdmin = this._permissionsService.isSuperAdmin()
    this.initializeSubscriptions()
  }

  private initializeSubscriptions(): void {
    this._bootstrapModalService
      .getModalClosed()
      .pipe(
        switchMap(() => this._bootstrapModalService.getDataIssued()),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        if (data?.modalType === MODAL_TYPE.MODULE_FORM) {
          this.getModulesByRole()
        }
      })

    this._selectionService.selectedRoleId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((roleId) => {
        this.selectedRoleId = roleId

        this.selectedModuleId = null
        this._selectionService.setModuleId(null)

        this.getModulesByRole()
      })

    this._selectionService.selectedModuleId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((moduleId) => {
        this.selectedModuleId = moduleId
      })

    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((term) =>
          this._moduleService.getAllModules(term, 1, this.pageSize)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => this.modules$.next(response.data.result))
  }

  private getModulesByRole(): void {
    if (!this.selectedRoleId) {
      this.modules$.next([])
      return
    }

    this.isLoading = true

    this._moduleService
      .getAllModules(undefined, 1, this.pageSize)
      .pipe(
        tap((response: any) => {
          this.isLoading = false
          const modules = response.data?.result || []
          const modulesWithStatus = modules.map((module: Module) => ({
            ...module,
            isActiveForRole: true,
          }))
          this.modules$.next(modulesWithStatus)
        }),
        catchError((err) => {
          this.isLoading = false
          this.modules$.next([])
          console.error('⚠️ Error al obtener módulos:', err)
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

  public searchModules(): void {
    this.isLoading = true
    this._moduleService
      .getAllModules(this.searchTerm, 1, this.pageSize)
      .subscribe((response) => {
        this.isLoading = false
        this.modules$.next(response.data.result)
      })
  }

  public toggleModuleForRole(moduleId: string, event?: Event): void {
    if (event) {
      event.stopPropagation()
    }
  }

  openModal(): void {
    this._bootstrapModalService.openModal({
      component: ModuleFormComponent,
      data: { roleId: this.selectedRoleId, modalType: MODAL_TYPE.MODULE_FORM },
    })
  }

  openModalPermission(moduleId: string, event: Event): void {
    event.stopPropagation()
    this._bootstrapModalService.openModal({
      component: PermissionFormComponent,
      data: { moduleId, modalType: MODAL_TYPE.PERMISSION_FORM },
    })
  }

  public openEditModal(moduleId: string, event: Event): void {
    event.stopPropagation()
    this._bootstrapModalService.openModal({
      component: ModuleFormComponent,
      data: { moduleId, modalType: MODAL_TYPE.MODULE_FORM },
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
