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
}

export interface PublicProductFilters {
  categories: { id: string; name: string }[]
  subcategories: { id: string; name: string; categoryId: string }[]
}

export interface PublicProductQuery {
  companyName?: string
  search?: string
  categoryId?: string
  subcategoryId?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'views' | 'price-asc' | 'price-desc' | 'newest'
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
