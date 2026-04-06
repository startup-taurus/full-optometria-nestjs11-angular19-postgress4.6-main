import { Client } from './client.interface';
import { LaboratoryOrder } from './laboratory-order.interface';

export enum PurchaseOrderStatus {
  PENDING = 'pending',
  INVOICED = 'invoiced',
  CANCELLED = 'cancelled',
}

export interface PurchaseOrder {
  id: string;
  orderNumber?: number;
  clientId: string;
  laboratoryOrderId: string;
  companyId?: string;
  branchId?: string;
  shouldInvoice: boolean;
  status: PurchaseOrderStatus;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  laboratoryOrder?: LaboratoryOrder;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productCode: string;
  productName: string;
  productBrand?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderDto {
  laboratoryOrderId: string;
  clientId: string;
  shouldInvoice?: boolean;
  totalAmount?: number;
}

export interface UpdatePurchaseOrderDto {
  shouldInvoice?: boolean;
  status?: PurchaseOrderStatus;
  totalAmount?: number;
}

export interface PurchaseOrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PurchaseOrderStatus;
  shouldInvoice?: boolean;
}
