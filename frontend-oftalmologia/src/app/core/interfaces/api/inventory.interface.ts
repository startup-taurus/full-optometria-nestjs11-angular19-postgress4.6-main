export interface PaginatedResponse<T> {
  result: T[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface Category {
  id: string
  name: string
  description?: string
  isActive: boolean
  branchId: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface Subcategory {
  id: string
  name: string
  description?: string
  categoryId: string
  category?: Category
  isActive: boolean
  branchId: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  isActive: boolean
  branchId: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface Product {
  id: string
  branchId: string
  code: string
  name: string
  // slug?: string
  description?: string
  categoryId: string
  subcategoryId: string
  brand: string
  unitPrice: number
  quantity: number
  defaultSupplierId?: string
  createdByUserId?: string
  views?: number
  isActive: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
  branch?: any
  category?: Category
  subcategory?: Subcategory
  defaultSupplier?: Supplier
  createdByUser?: {
    id?: string
    firstName: string
    lastName: string
    mobilePhone: string
  }
  images?: ProductImage[]
}

export interface ProductImage {
  id: string
  path: string
  isCover: boolean
}
