import { Client } from './client.interface'
import { LaboratoryOrder } from './laboratory-order.interface'

export enum PurchaseOrderStatus {
  PENDING = 'pending',
  INVOICED = 'invoiced',
  CANCELLED = 'cancelled',
}

export enum PurchaseOrderInvoiceState {
  NEW = 'NEW',
  APPROVED = 'APPROVED',
  RETURNED = 'RETURNED',
  NOT_APPROVED = 'NOT_APPROVED',
  AUTHORIZED = 'AUTHORIZED',
  FAILED = 'FAILED',
}

export interface PurchaseOrderInvoice {
  id: string
  purchaseOrderId: string
  companyId?: string | null
  branchId?: string | null
  externalInvoiceId?: string | null
  invoiceNumber?: string | null
  accessKey?: string | null
  state: PurchaseOrderInvoiceState
  paymentMethod: string
  taxPercent: number
  subtotal: number
  taxAmount: number
  totalAmount: number
  xmlBase64?: string | null
  authorizationNumber?: string | null
  authorizationDate?: string | null
  errorMessage?: string | null
  createdAt: string
  updatedAt: string
}

export interface BillingPaymentMethod {
  code: string
  name: string
  description?: string | null
  isActive: boolean
}

export interface PurchaseOrder {
  id: string
  orderNumber?: number
  clientId: string | null
  laboratoryOrderId: string
  companyId?: string
  branchId?: string
  shouldInvoice: boolean
  status: PurchaseOrderStatus
  totalAmount?: number
  createdAt: string
  updatedAt: string
  client?: Client
  laboratoryOrder?: LaboratoryOrder
  items?: PurchaseOrderItem[]
  invoice?: PurchaseOrderInvoice | null
}

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  productId: string
  productCode: string
  productName: string
  productBrand?: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
  createdAt: string
  updatedAt: string
}

export interface CreatePurchaseOrderDto {
  laboratoryOrderId: string
  clientId?: string | null
  shouldInvoice?: boolean
  totalAmount?: number
}

export interface UpdatePurchaseOrderDto {
  shouldInvoice?: boolean
  status?: PurchaseOrderStatus
  totalAmount?: number
}

export interface CreatePurchaseOrderInvoiceDto {
  paymentMethod: string
  taxPercent: number
}

export interface RetryPurchaseOrderInvoiceDto {
  paymentMethod?: string
  taxPercent?: number
}

export interface PurchaseOrderQueryParams {
  page?: number
  limit?: number
  search?: string
  clientName?: string
  invoiceNumber?: string
  status?: PurchaseOrderStatus
  invoiceState?: PurchaseOrderInvoiceState
  paymentMethod?: string
  shouldInvoice?: boolean
  minTotal?: number
  maxTotal?: number
  dateFrom?: string
  dateTo?: string
}
