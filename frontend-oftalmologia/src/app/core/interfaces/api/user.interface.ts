import { Role } from './role.interface'

export interface Branch {
  id: string
  name: string
  code: string
  address: string
  city: string
  phone?: string
  corporateEmail?: string
  openingHours?: string
  isActive: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface Company {
  id: string
  name: string
  code?: string
  email?: string
  phone?: string
  slug?: string
  logoFileId?: string
  logoFile?: {
    id: string
    filename: string
    path: string
    mimeType: string
  }
  isActive?: boolean
  maxUsers?: number | null
  maxBranches?: number | null
  hasBillingApiKey?: boolean
}

export interface User {
  id: string
  username: string
  firstName: string
  lastName: string
  password?: string
  email: string
  address?: string
  documentNumber?: string
  dateOfBirth?: Date | string
  homePhone?: string
  mobilePhone?: string
  profilePhoto?: string
  failedLoginAttempts?: number
  isLocked?: boolean
  isActive?: boolean
  isAdmin?: boolean // ⭐ Campo para identificar si es admin
  roleId: string
  role?: Role
  branchId?: string
  branch?: Branch
  companyId?: string
  company?: Company
  lastLoginAt?: Date | string
  createdAt?: Date | string
  updatedAt?: Date | string
  permissionIds?: string[] // ⭐ Nueva propiedad para los IDs de permisos
}

export interface UserLoginRequest {
  identifier: string
  password: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: string
}

export interface UserState {
  user: User | null
  message: string | null
  loading: boolean
}
