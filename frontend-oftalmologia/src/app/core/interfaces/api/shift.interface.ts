import { Patient } from './patient.interface'

export interface ShiftStatus {
  id: string
  name: string
  description: string
  color: string
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Shift {
  id: string
  patientId: string
  branchId: string
  statusId: string
  appointmentDate: Date | string
  description: string
  name: string
  notes?: string
  createdAt: Date | string
  updatedAt: Date | string
  patient: Patient
  status: ShiftStatus
  branch: {
    id: string
    name: string
  }
}

export interface CreateShiftDto {
  patientId: string
  appointmentDate: string
  description?: string
  notes?: string
}

export interface UpdateShiftDto {
  statusId?: string
  appointmentDate?: string
  description?: string
  notes?: string
}

export interface QueryShiftDto {
  page?: number
  limit?: number
  patientName?: string
  patientId?: string
  phone?: string
  email?: string
  statusId?: string
  branchId?: string
  dateFrom?: string
  dateTo?: string
}
