import { Injectable } from '@angular/core'
import {
  BehaviorSubject,
  Observable,
  map,
  shareReplay,
  tap,
  catchError,
} from 'rxjs'
import { StorageService } from '../ui/storage.service'
import { AuthenticationService } from '../api/auth.service'
import { USER_SESSION } from '@core/helpers/global/global.constants'
import {
  PERMISSION_NAME_TO_ID_MAP,
  MODULE_NAME_TO_PERMISSION_MAP,
} from '@core/constants/permissions.constants'
import {
  UserPermissions,
  Permission,
  Module,
} from '@core/interfaces/ui/permissions.interface'

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  private _userPermissions$ = new BehaviorSubject<UserPermissions | null>(null)
  private _permissionsLoaded$ = new BehaviorSubject<boolean>(false)
  private _loadingPromise: Observable<boolean> | null = null

  public userPermissions$ = this._userPermissions$.asObservable()
  public permissionsLoaded$ = this._permissionsLoaded$.asObservable()

  constructor(
    private _storageService: StorageService,
    private _authService: AuthenticationService
  ) {
    this._permissionsLoaded$.next(false)
  }

  public loadUserPermissions(): Observable<boolean> {
    if (this._permissionsLoaded$.value) {
      return new Observable((observer) => {
        observer.next(true)
        observer.complete()
      })
    }

    if (this._loadingPromise) {
      return this._loadingPromise
    }

    this._loadingPromise = this._authService.getMeUser().pipe(
      map((response) => {
        if (response.data) {
          if (
            !response.data.permissionIds ||
            response.data.permissionIds.length === 0
          ) {
            const emptyPermissions: UserPermissions = {
              user: response.data,
              permissions: [],
              modules: [],
            }
            this._userPermissions$.next(emptyPermissions)
            this._permissionsLoaded$.next(true)
            return true
          }

          const userPermissions: UserPermissions = {
            user: response.data,
            permissions: response.data.permissionIds.map((id) => ({
              id: id,
              permissionName: `permission_${id}`,
              description: `Permission with ID ${id}`,
              module: { id: '', moduleName: '', description: '' },
            })),
            modules: [],
          }

          this._userPermissions$.next(userPermissions)
          this._permissionsLoaded$.next(true)
          return true
        } else {
          const emptyPermissions: UserPermissions = {
            user: null,
            permissions: [],
            modules: [],
          }
          this._userPermissions$.next(emptyPermissions)
          this._permissionsLoaded$.next(true)
          return false
        }
      }),
      tap(() => {
        this._loadingPromise = null
      }),
      shareReplay(1)
    )

    return this._loadingPromise
  }

  public forceReloadPermissions(): Observable<boolean> {
    if (this._loadingPromise) {
      return this._loadingPromise
    }

    this._permissionsLoaded$.next(false)
    this._userPermissions$.next(null)
    this._loadingPromise = null

    return this.loadUserPermissions()
  }

  public hasPermission(permissionName: string): boolean {
    const userPermissions = this._userPermissions$.value
    if (
      !userPermissions ||
      !userPermissions.permissions ||
      userPermissions.permissions.length === 0
    ) {
      return false
    }

    const hasPermissionByName = userPermissions.permissions.some(
      (permission) => permission.permissionName === permissionName
    )

    if (!hasPermissionByName && PERMISSION_NAME_TO_ID_MAP[permissionName]) {
      const mappedId = PERMISSION_NAME_TO_ID_MAP[permissionName]
      return this.hasPermissionById(mappedId)
    }

    return hasPermissionByName
  }

  public hasPermissionById(permissionId: string): boolean {
    const userPermissions = this._userPermissions$.value

    if (!userPermissions) {
      return false
    }

    if (!userPermissions.permissions) {
      return false
    }

    if (userPermissions.permissions.length === 0) {
      return false
    }

    const result = userPermissions.permissions.some(
      (permission) => permission.id === permissionId
    )

    return result
  }

  // Verificar múltiples permisos por ID
  public hasAnyPermissionById(permissionIds: string[]): boolean {
    return permissionIds.some((permissionId) =>
      this.hasPermissionById(permissionId)
    )
  }

  public hasAllPermissionsById(permissionIds: string[]): boolean {
    return permissionIds.every((permissionId) =>
      this.hasPermissionById(permissionId)
    )
  }

  public hasAnyPermission(permissionNames: string[]): boolean {
    return permissionNames.some((permission) => this.hasPermission(permission))
  }

  public hasAllPermissions(permissionNames: string[]): boolean {
    return permissionNames.every((permission) => this.hasPermission(permission))
  }

  public hasModule(moduleName: string): boolean {
    const userPermissions = this._userPermissions$.value
    if (userPermissions && userPermissions.modules) {
      const hasModuleDirectly = userPermissions.modules.some(
        (module) => module.moduleName === moduleName
      )
      if (hasModuleDirectly) return true
    }

    if (MODULE_NAME_TO_PERMISSION_MAP[moduleName]) {
      const mappedPermissionId = MODULE_NAME_TO_PERMISSION_MAP[moduleName]
      return this.hasPermissionById(mappedPermissionId)
    }

    return false
  }

  public hasAnyModule(moduleNames: string[]): boolean {
    return moduleNames.some((module) => this.hasModule(module))
  }

  public getUserPermissions(): UserPermissions | null {
    return this._userPermissions$.value
  }

  public getUser(): any {
    const userPermissions = this._userPermissions$.value
    return userPermissions ? userPermissions.user : null
  }

  public getUserRole(): string | null {
    const user = this.getUser()
    return user && user.role ? user.role.roleName : null
  }

  public isRole(roleName: string): boolean {
    const userRole = this.getUserRole()
    return userRole === roleName
  }

  public isAnyRole(roleNames: string[]): boolean {
    const userRole = this.getUserRole()
    return userRole ? roleNames.includes(userRole) : false
  }

  public isSuperAdmin(): boolean {
    return this.isRole('SUPER_ADMIN')
  }

  public isAdmin(): boolean {
    // Primero intentar usar el campo isAdmin directamente
    const user = this.getUser()
    if (user && typeof user.isAdmin === 'boolean') {
      return user.isAdmin
    }

    // Fallback: verificar por nombre de rol (case-insensitive)
    return this.isAnyRole(['SUPER_ADMIN', 'ADMIN', 'Admin', 'admin'])
  }

  public isLoaded(): boolean {
    return this._permissionsLoaded$.value
  }

  public clearPermissions(): void {
    this._userPermissions$.next(null)
    this._permissionsLoaded$.next(false)
  }
}
