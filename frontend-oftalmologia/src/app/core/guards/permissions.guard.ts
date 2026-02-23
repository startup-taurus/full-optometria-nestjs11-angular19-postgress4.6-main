import { Injectable } from '@angular/core'
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router'
import { Observable, map, take, switchMap } from 'rxjs'
import { PermissionsService } from '../services/api/permissions.service'
import { AuthenticationService } from '../services/api/auth.service'
import { ToastrNotificationService } from '../services/ui/notification.service'

@Injectable({
  providedIn: 'root',
})
export class PermissionsGuard implements CanActivate, CanActivateChild {
  constructor(
    private _permissionsService: PermissionsService,
    private _authService: AuthenticationService,
    private _router: Router,
    private _notificationService: ToastrNotificationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    return this.checkPermissions(route, state)
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    return this.checkPermissions(childRoute, state)
  }

  private checkPermissions(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    if (this._authService.isLoggedOut()) {
      this._router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      })
      return false
    }

    const requiredPermissions = route.data['permissions'] as string[]
    const requiredModules = route.data['modules'] as string[]
    const requiredRoles = route.data['roles'] as string[]
    const requireAll = (route.data['requireAll'] as boolean) || false

    if (!requiredPermissions && !requiredModules && !requiredRoles) {
      return true
    }

    return this._permissionsService.permissionsLoaded$.pipe(
      take(1),
      switchMap((loaded) => {
        if (!loaded) {
          return this._permissionsService
            .loadUserPermissions()
            .pipe(
              map(() =>
                this.validateAccess(
                  requiredPermissions,
                  requiredModules,
                  requiredRoles,
                  requireAll,
                  state.url
                )
              )
            )
        }

        return new Observable<boolean>((observer) => {
          const hasAccess = this.validateAccess(
            requiredPermissions,
            requiredModules,
            requiredRoles,
            requireAll,
            state.url
          )
          observer.next(hasAccess)
          observer.complete()
        })
      })
    )
  }

  private validateAccess(
    requiredPermissions: string[],
    requiredModules: string[],
    requiredRoles: string[],
    requireAll: boolean,
    url: string
  ): boolean {
    let hasAccess = true

    if (requiredPermissions && requiredPermissions.length > 0) {
      const areIds = requiredPermissions.every((p) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          p
        )
      )

      let permissionCheck = false
      if (areIds) {
        if (requireAll) {
          permissionCheck =
            this._permissionsService.hasAllPermissionsById(requiredPermissions)
        } else {
          permissionCheck =
            this._permissionsService.hasAnyPermissionById(requiredPermissions)
        }
      } else {
        if (requireAll) {
          permissionCheck =
            this._permissionsService.hasAllPermissions(requiredPermissions)
        } else {
          permissionCheck =
            this._permissionsService.hasAnyPermission(requiredPermissions)
        }
      }

      hasAccess = hasAccess && permissionCheck
    }

    if (requiredModules && requiredModules.length > 0) {
      if (requireAll) {
        hasAccess =
          hasAccess &&
          requiredModules.every((module) =>
            this._permissionsService.hasModule(module)
          )
      } else {
        hasAccess =
          hasAccess && this._permissionsService.hasAnyModule(requiredModules)
      }
    }

    if (requiredRoles && requiredRoles.length > 0) {
      hasAccess = hasAccess && this._permissionsService.isAnyRole(requiredRoles)
    }

    if (!hasAccess) {
      this._notificationService.showNotification({
        title: 'SYSTEM.ACCESS_DENIED',
        message: 'SYSTEM.ERROR.INSUFFICIENT_PERMISSIONS',
        type: 'error',
      })

      this._router.navigate(['/dashboard'])
    }

    return hasAccess
  }
}
