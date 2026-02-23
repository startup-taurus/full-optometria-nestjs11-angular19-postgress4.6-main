import { Injectable } from '@angular/core'
import { Observable, combineLatest, map } from 'rxjs'
import { PermissionsService } from '../api/permissions.service'

export interface NavigationItem {
  title: string
  path?: string
  icon?: string
  children?: NavigationItem[]
  permissions?: string[]
  modules?: string[]
  roles?: string[]
  requireAll?: boolean
  isVisible?: boolean
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private _navigationItems: NavigationItem[] = [
    {
      title: 'NAVIGATION.DASHBOARD',
      path: '/dashboard',
      icon: 'home',
      permissions: ['VIEW_DASHBOARD'],
      modules: ['DASHBOARD'],
    },
    {
      title: 'NAVIGATION.PATIENTS',
      path: '/patients',
      icon: 'users',
      permissions: ['READ_PATIENT'],
      modules: ['PATIENTS'],
    },
    {
      title: 'NAVIGATION.APPOINTMENTS',
      path: '/appointments',
      icon: 'calendar',
      permissions: ['READ_APPOINTMENT'],
      modules: ['APPOINTMENTS'],
    },
    {
      title: 'NAVIGATION.REPORTS',
      path: '/reports',
      icon: 'chart-bar',
      permissions: ['VIEW_REPORTS'],
      modules: ['REPORTS'],
    },
    {
      title: 'NAVIGATION.ADMINISTRATION',
      icon: 'settings',
      children: [
        {
          title: 'NAVIGATION.USERS',
          path: '/users',
          icon: 'user',
          permissions: ['READ_USER'],
          modules: ['USERS'],
        },
        {
          title: 'NAVIGATION.SYSTEM_MANAGEMENT',
          path: '/system-management/roles-and-permissions',
          icon: 'shield',
          permissions: ['READ_ROLE', 'READ_MODULE', 'READ_PERMISSION'],
          modules: ['ROLES', 'MODULES', 'PERMISSIONS'],
          requireAll: false,
        },
      ],
    },
  ]

  constructor(private _permissionsService: PermissionsService) {}

  public getNavigationItems(): Observable<NavigationItem[]> {
    return combineLatest([
      this._permissionsService.userPermissions$,
      this._permissionsService.permissionsLoaded$,
    ]).pipe(
      map(([userPermissions, loaded]) => {
        if (!loaded || !userPermissions) {
          return []
        }
        return this.filterNavigationItems(this._navigationItems)
      })
    )
  }

  private filterNavigationItems(items: NavigationItem[]): NavigationItem[] {
    return items
      .filter((item) => this.isItemVisible(item))
      .map((item) => ({
        ...item,
        children: item.children
          ? this.filterNavigationItems(item.children)
          : undefined,
        isVisible: true,
      }))
  }

  private isItemVisible(item: NavigationItem): boolean {
    // Si no tiene restricciones, es visible
    if (!item.permissions && !item.modules && !item.roles) {
      return true
    }

    let hasAccess = true

    // Verificar permisos
    if (item.permissions && item.permissions.length > 0) {
      if (item.requireAll) {
        hasAccess =
          hasAccess &&
          this._permissionsService.hasAllPermissions(item.permissions)
      } else {
        hasAccess =
          hasAccess &&
          this._permissionsService.hasAnyPermission(item.permissions)
      }
    }

    // Verificar módulos
    if (item.modules && item.modules.length > 0) {
      if (item.requireAll) {
        hasAccess =
          hasAccess &&
          item.modules.every((module) =>
            this._permissionsService.hasModule(module)
          )
      } else {
        hasAccess =
          hasAccess && this._permissionsService.hasAnyModule(item.modules)
      }
    }

    // Verificar roles
    if (item.roles && item.roles.length > 0) {
      hasAccess = hasAccess && this._permissionsService.isAnyRole(item.roles)
    }

    // Para elementos con hijos, verificar si al menos un hijo es visible
    if (item.children && item.children.length > 0) {
      const hasVisibleChildren = item.children.some((child) =>
        this.isItemVisible(child)
      )
      hasAccess = hasAccess && hasVisibleChildren
    }

    return hasAccess
  }

  // Método para agregar elementos de navegación dinámicamente
  public addNavigationItem(item: NavigationItem, parentTitle?: string): void {
    if (parentTitle) {
      const parent = this.findNavigationItem(this._navigationItems, parentTitle)
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(item)
      }
    } else {
      this._navigationItems.push(item)
    }
  }

  // Método para remover elementos de navegación
  public removeNavigationItem(title: string): void {
    this._navigationItems = this.removeNavigationItemRecursive(
      this._navigationItems,
      title
    )
  }

  private findNavigationItem(
    items: NavigationItem[],
    title: string
  ): NavigationItem | undefined {
    for (const item of items) {
      if (item.title === title) {
        return item
      }
      if (item.children) {
        const found = this.findNavigationItem(item.children, title)
        if (found) {
          return found
        }
      }
    }
    return undefined
  }

  private removeNavigationItemRecursive(
    items: NavigationItem[],
    title: string
  ): NavigationItem[] {
    return items.filter((item) => {
      if (item.title === title) {
        return false
      }
      if (item.children) {
        item.children = this.removeNavigationItemRecursive(item.children, title)
      }
      return true
    })
  }

  // Método para verificar si el usuario puede acceder a una ruta específica
  public canAccessRoute(path: string): boolean {
    const item = this.findNavigationItemByPath(this._navigationItems, path)
    return item ? this.isItemVisible(item) : true // Si no se encuentra la ruta, permitir acceso por defecto
  }

  private findNavigationItemByPath(
    items: NavigationItem[],
    path: string
  ): NavigationItem | undefined {
    for (const item of items) {
      if (item.path === path) {
        return item
      }
      if (item.children) {
        const found = this.findNavigationItemByPath(item.children, path)
        if (found) {
          return found
        }
      }
    }
    return undefined
  }
}
