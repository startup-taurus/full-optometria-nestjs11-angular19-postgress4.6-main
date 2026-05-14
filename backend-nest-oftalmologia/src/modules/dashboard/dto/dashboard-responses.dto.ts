export interface AppointmentsTrendResponse {
  labels: string[];
  data: number[];
  total: number;
  average?: number;
  period?: string;
}

export interface DiagnosisFrequencyResponse {
  labels: string[];
  data: number[];
  total: number;
}

export interface LaboratoryOrdersStatusResponse {
  labels: string[];
  data: number[];
  total: number;
}

export interface ProductsInventoryResponse {
  labels: string[];
  data: number[];
  total: number;
  details: {
    lowStock: string[];
    mediumStock: string[];
    highStock: string[];
  };
}

export interface ShiftStatusDistributionResponse {
  labels: string[];
  data: number[];
  total: number;
}

export interface PatientsAgeDemographicsResponse {
  labels: string[];
  data: number[];
  total: number;
}

export interface TopProductSoldItemResponse {
  productId: string;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface TopProductsSoldResponse {
  labels: string[];
  data: number[];
  total: number;
  period: string;
  items: TopProductSoldItemResponse[];
}

export interface PurchaseOrdersSummaryResponse {
  totalOrders: number;
  statuses: {
    pending: number;
    pendingToInvoice: number;
    invoiced: number;
    cancelled: number;
  };
  amounts: {
    invoiced: number;
    nonInvoiced: number;
    gross: number;
  };
}
