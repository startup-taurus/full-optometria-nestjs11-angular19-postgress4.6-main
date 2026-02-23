import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  OnDestroy,
} from '@angular/core'
import { Subject, takeUntil } from 'rxjs'
import { PermissionsService } from '@core/services/api/permissions.service'

@Directive({
  selector: '[hasPermissionId]',
  standalone: true,
})
export class HasPermissionIdDirective implements OnInit, OnDestroy {
  private _permissionIds: string[] = []
  private _requireAll: boolean = false
  private _destroy$ = new Subject<void>()

  constructor(
    private _templateRef: TemplateRef<any>,
    private _viewContainer: ViewContainerRef,
    private _permissionsService: PermissionsService
  ) {}

  @Input()
  set hasPermissionId(permissionIds: string | string[]) {
    this._permissionIds = Array.isArray(permissionIds)
      ? permissionIds
      : [permissionIds]
    this._updateView()
  }

  @Input()
  set hasPermissionIdRequireAll(requireAll: boolean) {
    this._requireAll = requireAll
    this._updateView()
  }

  ngOnInit() {
    // Escuchar cambios en los permisos del usuario
    this._permissionsService.userPermissions$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this._updateView()
      })
  }

  ngOnDestroy() {
    this._destroy$.next()
    this._destroy$.complete()
  }

  private _updateView(): void {
    this._viewContainer.clear()

    if (this._permissionIds.length === 0) {
      // Si no hay permisos requeridos, mostrar por defecto
      this._viewContainer.createEmbeddedView(this._templateRef)
      return
    }

    const hasAccess = this._requireAll
      ? this._permissionsService.hasAllPermissionsById(this._permissionIds)
      : this._permissionsService.hasAnyPermissionById(this._permissionIds)

    if (hasAccess) {
      this._viewContainer.createEmbeddedView(this._templateRef)
    }
  }
}
