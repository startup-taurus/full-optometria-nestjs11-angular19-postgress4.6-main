export interface UserPermissions {
  user: any
  permissions: Permission[]
  modules: Module[]
}

export interface Permission {
  id: string
  permissionName: string
  description: string
  module?: Module
  moduleId?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Module {
  id: string
  moduleName: string
  description: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Role {
  id: string
  roleName: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RolePermission {
  roleId: string
  permissionId: string
  isEnabled: boolean
  role?: Role
  permission?: Permission
}

export interface RoleModule {
  roleId: string
  moduleId: string
  isEnabled: boolean
  role?: Role
  module?: Module
}
