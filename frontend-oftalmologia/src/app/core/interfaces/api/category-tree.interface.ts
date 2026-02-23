export interface CategoryTreeNode {
  id: string
  name: string
  description?: string
  isActive: boolean
  type: 'category' | 'subcategory'
  parentId?: string
  categoryId?: string
  level: number
  branchId: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateCategoryDto {
  name: string
  description?: string
  isActive?: boolean
}

export interface CreateSubcategoryDto {
  name: string
  description?: string
  categoryId: string
  isActive?: boolean
}

export interface UpdateCategoryDto {
  name?: string
  description?: string
  isActive?: boolean
}

export interface UpdateSubcategoryDto {
  name?: string
  description?: string
  categoryId?: string
  isActive?: boolean
}

export interface CategoryFilterDto {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface SubcategoryFilterDto {
  search?: string
  isActive?: boolean
  categoryId?: string
  page?: number
  limit?: number
}
