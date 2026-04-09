export enum FrameType {
  THREE_PIECES_AIR = '3_piezas_al_aire',
  SEMI_AIR_GROOVED = 'ranurado_semiaire',
  COMPLETE = 'completo',
}

export enum LaboratoryOrderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  RECEIVED = 'received',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface LaboratoryOrderLineItem {
  productId: string
  quantity: number
  product?: {
    id: string
    code: string
    name: string
    brand: string
    quantity?: number
  }
}

export interface LaboratoryOrder {
  id: string
  orderNumber?: number
  branchId: string
  patientId: string
  clinicalHistoryId?: string
  attendanceDate: string
  deliveryDate: string
  clientId?: string
  odSphere?: string
  odCylinder?: string
  odAxis?: string
  odAdd?: string
  odHeight?: string
  odDnp?: string
  oiSphere?: string
  oiCylinder?: string
  oiAxis?: string
  oiAdd?: string
  oiHeight?: string
  oiDnp?: string
  cbase?: string
  sunDegree?: string
  prism?: string
  base?: string
  dVertex?: string
  pantos?: string
  panora?: string
  frameFit?: string
  profile?: string
  mid?: string
  distVp?: string
  engraving?: string
  productId?: string
  productIds?: string[]
  lineItems?: LaboratoryOrderLineItem[]
  frameType?: FrameType
  frameTypeDescription?: string
  frameBrand?: string
  frameModel?: string
  frameData?: string
  frameLargerDiameter?: string
  frameHorizontal?: string
  frameVertical?: string
  frameBridge?: string
  observations?: string
  status?: LaboratoryOrderStatus
  isConfirmed: boolean
  createdAt: string
  updatedAt: string
  patient?: {
    id: string
    firstName: string
    lastName: string
    documentNumber: string
    email: string
    mobilePhone: string
    homePhone: string
  }
  client?: {
    id: string
    firstName: string
    lastName: string
    documentNumber: string
    email: string
    mobilePhone: string
    homePhone: string
    address?: string
  }
  product?: {
    id: string
    code: string
    name: string
    brand: string
  }
  products?: {
    id: string
    code: string
    name: string
    brand: string
  }[]
  branch?: {
    id: string
    name: string
    code: string
    address: string
    city: string
    phone?: string
    corporateEmail?: string
  }
}

export interface CreateLaboratoryOrderDto {
  patientId: string
  clinicalHistoryId?: string
  clientId?: string
  attendanceDate: string
  deliveryDate: string
  odSphere?: string
  odCylinder?: string
  odAxis?: string
  odAdd?: string
  odHeight?: string
  odDnp?: string
  oiSphere?: string
  oiCylinder?: string
  oiAxis?: string
  oiAdd?: string
  oiHeight?: string
  oiDnp?: string
  cbase?: string
  sunDegree?: string
  prism?: string
  base?: string
  dVertex?: string
  pantos?: string
  panora?: string
  frameFit?: string
  profile?: string
  mid?: string
  distVp?: string
  engraving?: string
  productId?: string
  productIds?: string[]
  lineItems?: LaboratoryOrderLineItem[]
  ignoreStockValidation?: boolean
  frameType?: FrameType
  frameTypeDescription?: string
  frameBrand?: string
  frameModel?: string
  frameData?: string
  frameLargerDiameter?: string
  frameHorizontal?: string
  frameVertical?: string
  frameBridge?: string
  observations?: string
}

export interface UpdateLaboratoryOrderDto
  extends Partial<CreateLaboratoryOrderDto> {}

export interface LaboratoryOrderQueryParams {
  page?: number
  limit?: number
  patientId?: string
  isConfirmed?: boolean
  search?: string
  identification?: string
  firstName?: string
  lastName?: string
  phone?: string
  status?: LaboratoryOrderStatus | 'confirmed'
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface ChangeStatusDto {
  status: LaboratoryOrderStatus
}

export interface PreloadedOrderData {
  clinicalHistoryId: string
  patientId: string
  attendanceDate?: string
  firstName: string
  lastName: string
  documentNumber: string
  email: string
  mobilePhone: string
  homePhone: string
  odSphere?: string
  odCylinder?: string
  odAxis?: string
  odAdd?: string
  oiSphere?: string
  oiCylinder?: string
  oiAxis?: string
  oiAdd?: string
  odHeight?: string
  odDnp?: string
  oiHeight?: string
  oiDnp?: string
  cbase?: string
  sunDegree?: string
  prism?: string
  base?: string
}
