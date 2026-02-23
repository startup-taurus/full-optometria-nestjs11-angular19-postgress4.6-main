import { MenuItemType } from './menu-meta'
import { PermissionsService } from '../../services/api/permissions.service'

export class MenuPermissionHelper {
  static filterMenuByPermissions(
    menuItems: MenuItemType[],
    permissionsService: PermissionsService
  ): MenuItemType[] {
    return menuItems.filter((item) =>
      this.hasPermissionForMenuItem(item, permissionsService)
    )
  }

  static hasPermissionForMenuItem(
    item: MenuItemType,
    permissionsService: PermissionsService
  ): boolean {
    if (item.isTitle) {
      return true
    }

    if (item.key === 'COMPANIES') {
      return permissionsService.isSuperAdmin()
    }

    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true
    }

    const operator = item.permissionOperator || 'OR'

    if (operator === 'AND') {
      return permissionsService.hasAllPermissionsById(item.requiredPermissions)
    } else {
      return permissionsService.hasAnyPermissionById(item.requiredPermissions)
    }
  }

  static filterEmptyTitles(
    menuItems: MenuItemType[],
    permissionsService: PermissionsService
  ): MenuItemType[] {
    const result: MenuItemType[] = []
    let currentTitle: MenuItemType | null = null
    let hasVisibleItems = false

    for (const item of menuItems) {
      if (item.isTitle) {
        if (currentTitle && hasVisibleItems) {
          result.push(currentTitle)
        }

        currentTitle = item
        hasVisibleItems = false
      } else {
        if (this.hasPermissionForMenuItem(item, permissionsService)) {
          if (currentTitle && !hasVisibleItems) {
            result.push(currentTitle)
            hasVisibleItems = true
          }

          result.push(item)
        }
      }
    }

    if (currentTitle && hasVisibleItems) {
    }

    return result
  }
}
