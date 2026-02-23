export interface Role {
  id: string
  roleName: string
  description?: string
  isActive?: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface RoleState {
  roles: Role[]
  selectedRole: Role | null
  loading: boolean
  message: string | null
}
