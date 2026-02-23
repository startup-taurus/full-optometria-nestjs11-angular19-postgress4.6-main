import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  OnDestroy,
} from '@angular/core'
import { Subscription, combineLatest } from 'rxjs'
import { PermissionsService } from '../../core/services/api/permissions.service'

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private _permissions: string[] = []
  private _modules: string[] = []
  private _roles: string[] = []
  private _requireAll: boolean = false
  private _hasView = false
  private _subscription: Subscription = new Subscription()

  constructor(
    private _templateRef: TemplateRef<any>,
    private _viewContainer: ViewContainerRef,
    private _permissionsService: PermissionsService
  ) {}

  @Input() set hasPermission(permissions: string | string[]) {
    this._permissions = Array.isArray(permissions) ? permissions : [permissions]
    this._updateView()
  }

  @Input() set hasModule(modules: string | string[]) {
    this._modules = Array.isArray(modules) ? modules : [modules]
    this._updateView()
  }

  @Input() set hasRole(roles: string | string[]) {
    this._roles = Array.isArray(roles) ? roles : [roles]
    this._updateView()
  }

  @Input() set requireAll(value: boolean) {
    this._requireAll = value
    this._updateView()
  }

  ngOnInit(): void {
    this._subscription.add(
      combineLatest([
        this._permissionsService.permissionsLoaded$,
        this._permissionsService.userPermissions$,
      ]).subscribe(([loaded, permissions]) => {
        if (!loaded) {

          this._viewContainer.clear()
          this._hasView = false
          return
        }

        this._updateView()
      })
    )
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe()
  }

  private _updateView(): void {
    const shouldShow = this._checkAccess()

    if (shouldShow && !this._hasView) {
      this._viewContainer.createEmbeddedView(this._templateRef)
      this._hasView = true
    } else if (!shouldShow && this._hasView) {
      this._viewContainer.clear()
      this._hasView = false
    }
  }

  private _checkAccess(): boolean {
    let hasAccess = true

    if (this._permissions && this._permissions.length > 0) {
      if (this._requireAll) {
        hasAccess =
          hasAccess &&
          this._permissionsService.hasAllPermissions(this._permissions)
      } else {
        hasAccess =
          hasAccess &&
          this._permissionsService.hasAnyPermission(this._permissions)
      }
    }

    // Verificar módulos
    if (this._modules && this._modules.length > 0) {
      if (this._requireAll) {
        hasAccess =
          hasAccess &&
          this._modules.every((module) =>
            this._permissionsService.hasModule(module)
          )
      } else {
        hasAccess =
          hasAccess && this._permissionsService.hasAnyModule(this._modules)
      }
    }

    // Verificar roles
    if (this._roles && this._roles.length > 0) {
      hasAccess = hasAccess && this._permissionsService.isAnyRole(this._roles)
    }

    return hasAccess
  }
}

// Directiva adicional para ocultar elementos (lógica inversa)
@Directive({
  selector: '[hideIfNoPermission]',
  standalone: true,
})
export class HideIfNoPermissionDirective implements OnInit, OnDestroy {
  private _permissions: string[] = []
  private _modules: string[] = []
  private _roles: string[] = []
  private _requireAll: boolean = false
  private _hasView = true
  private _subscription: Subscription = new Subscription()

  constructor(
    private _templateRef: TemplateRef<any>,
    private _viewContainer: ViewContainerRef,
    private _permissionsService: PermissionsService
  ) {

    this._hasView = false
  }

  @Input() set hideIfNoPermission(permissions: string | string[]) {
    this._permissions = Array.isArray(permissions) ? permissions : [permissions]
    this._updateView()
  }

  @Input() set hideIfNoModule(modules: string | string[]) {
    this._modules = Array.isArray(modules) ? modules : [modules]
    this._updateView()
  }

  @Input() set hideIfNoRole(roles: string | string[]) {
    this._roles = Array.isArray(roles) ? roles : [roles]
    this._updateView()
  }

  @Input() set requireAll(value: boolean) {
    this._requireAll = value
    this._updateView()
  }

  ngOnInit(): void {
    this._subscription.add(
      combineLatest([
        this._permissionsService.permissionsLoaded$,
        this._permissionsService.userPermissions$,
      ]).subscribe(([loaded, permissions]) => {
        if (!loaded) {

          this._viewContainer.clear()
          this._hasView = false
          return
        }

        this._updateView()
      })
    )
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe()
  }

  private _updateView(): void {
    const hasAccess = this._checkAccess()

    if (hasAccess && !this._hasView) {
      this._viewContainer.createEmbeddedView(this._templateRef)
      this._hasView = true
    } else if (!hasAccess && this._hasView) {
      this._viewContainer.clear()
      this._hasView = false
    }
  }

  private _checkAccess(): boolean {
    let hasAccess = true

    if (this._permissions && this._permissions.length > 0) {
      if (this._requireAll) {
        hasAccess =
          hasAccess &&
          this._permissionsService.hasAllPermissions(this._permissions)
      } else {
        hasAccess =
          hasAccess &&
          this._permissionsService.hasAnyPermission(this._permissions)
      }
    }

    if (this._modules && this._modules.length > 0) {
      if (this._requireAll) {
        hasAccess =
          hasAccess &&
          this._modules.every((module) =>
            this._permissionsService.hasModule(module)
          )
      } else {
        hasAccess =
          hasAccess && this._permissionsService.hasAnyModule(this._modules)
      }
    }

    if (this._roles && this._roles.length > 0) {
      hasAccess = hasAccess && this._permissionsService.isAnyRole(this._roles)
    }

    return hasAccess
  }
}
