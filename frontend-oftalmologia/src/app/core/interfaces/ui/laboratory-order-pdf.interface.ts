import { LaboratoryOrder, FrameType } from '../api/laboratory-order.interface'
import { Branch } from '../api/branch.interface'

export interface LaboratoryOrderPdfData {
  order: LaboratoryOrder
  branch: Branch
  orderNumber: string
}

export interface BranchPdfData {
  name: string
  ruc?: string
  address: string
  email: string
  phone: string
  city: string
  country?: string
}

export interface CustomerPdfData {
  firstName: string
  lastName: string
  documentNumber: string
  attendanceDate: string
  deliveryDate: string
  homePhone?: string
  mobilePhone?: string
  workPhone?: string
  email: string
}

export interface OpticalDataPdf {
  sphere?: string
  cylinder?: string
  axis?: string
  add?: string
  height?: string
  dnp?: string
  cBase?: string
  sunDegree?: string
  prism?: string
  base?: string
}

export interface DesignParametersPdf {
  dVertex?: string
  pantos?: string
  panora?: string
  frameFit?: string
  profile?: string
  mid?: string
  distVp?: string
  engraving?: string
}

export interface FrameDataPdf {
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

export interface ProductPdfData {
  name?: string
  brand?: string
  code?: string
}
