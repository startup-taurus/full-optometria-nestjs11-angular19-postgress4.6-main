import { Permission } from './permission.interface'
import { Role } from './role.interface'

export interface RolePermission {
  id: string
  roleId: string
  permissionId: string
  role?: Role
  permission?: Permission
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface RoleModule {
  id: string
  roleId: string
  moduleId: string
  role?: Role
  module?: any
  createdAt?: Date | string
  updatedAt?: Date | string
}
