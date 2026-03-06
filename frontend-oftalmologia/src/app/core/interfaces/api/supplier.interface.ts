import { Branch } from './user.interface'

export interface Supplier {
  id: string
  name: string
  documentNumber?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  notes?: string
  isActive: boolean
  branchId: string
  branch?: Branch
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface CreateSupplierRequest {
  name: string
  documentNumber?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  notes?: string
}

export interface UpdateSupplierRequest {
  name?: string
  documentNumber?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  notes?: string
  isActive?: boolean
}

export interface QuerySupplierRequest {
  search?: string
  website?: string
  address?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface SuppliersResponse {
  data: Supplier[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
