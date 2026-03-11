export interface PublicProduct {
  id: string
  name: string
  description: string
  brand: string
  unitPrice: number
  quantity: number
  views: number
  createdAt: string
  branchName: string
  category: {
    id: string
    name: string
  } | null
  subcategory: {
    id: string
    name: string
  } | null
  branch: {
    id: string
    name: string
    address: string
    phone?: string
  } | null
  createdByUser: {
    firstName: string
    lastName: string
    mobilePhone: string
  } | null
  images: {
    id: string
    path: string
    isCover: boolean
  }[]
  hasActiveDiscount?: boolean
  discount?: {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT'
    value: number
    finalPrice: number
    originalPrice: number
  }
}

export interface PublicProductFilters {
  categories: { id: string; name: string; ids?: string[] }[]
  subcategories: { id: string; name: string; categoryId: string }[]
  brands: string[]
  branches: { id: string; name: string; phone?: string }[]
}

export interface PublicProductQuery {
  companyName?: string
  search?: string
  brand?: string
  categoryId?: string
  categoryIds?: string[]
  subcategoryId?: string
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
  sortBy?: 'views' | 'price-asc' | 'price-desc' | 'newest'
  branchId?: string
  page?: number
  limit?: number
}

export interface PublicProductResponse {
  items: PublicProduct[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

export interface CartItem {
  productId: string
  name: string
  brand: string
  imageUrl: string
  branchId: string
  branchName: string
  branchPhone: string
  unitPrice: number
  quantity: number
}

export interface CartBranchGroup {
  branchId: string
  branchName: string
  branchPhone: string
  items: CartItem[]
  totalAmount: number
  totalItems: number
}
