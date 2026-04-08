export interface ChartDataResponse {
  labels: string[]
  data?: number[] 
  series?: Array<{
    name: string
    data: number[]
  }>
  total: number
  average?: number
  period?: string
}

export interface ProductsInventoryResponse extends ChartDataResponse {
  details: {
    lowStock: string[]
    mediumStock: string[]
    highStock: string[]
  }
}

export interface TopProductSoldItem {
  productId: string
  productName: string
  quantitySold: number
  totalRevenue: number
}

export interface TopProductsSoldResponse extends ChartDataResponse {
  period: string
  items: TopProductSoldItem[]
}

export interface ApiResponse<T> {
  statusCode: number
  status: string
  message: {
    es: string
    en: string
  }
  data: T
}
