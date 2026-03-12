export interface PublicCatalogPdfBranch {
  id: string
  name: string
  phone?: string
  address?: string
  companyName?: string
}

export interface PublicCatalogPdfProductDiscount {
  type: string
  value: number
  finalPrice: number
  originalPrice: number
}

export interface PublicCatalogPdfProduct {
  name: string
  brand?: string
  description?: string
  unitPrice: number
  imageUrl?: string
  discount?: PublicCatalogPdfProductDiscount
}

export interface PublicCatalogPdfData {
  branch: PublicCatalogPdfBranch
  products: PublicCatalogPdfProduct[]
  generatedAt: Date
  title?: string
  logoUrl?: string
}
