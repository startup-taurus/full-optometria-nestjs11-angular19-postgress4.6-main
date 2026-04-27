import { Branch, Company } from './user.interface'

export interface Patient {
  id: string
  firstName: string
  lastName: string
  email?: string
  documentNumber?: string
  dateOfBirth?: Date | string
  address?: string
  homePhone?: string
  mobilePhone?: string
  profilePhoto?: string
  isActive: boolean
  branchId?: string
  branch?: Branch
  companyId?: string
  company?: Company
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface CreatePatientDto {
  firstName: string
  lastName: string
  email?: string
  documentNumber?: string
  dateOfBirth?: Date | string
  address?: string
  homePhone?: string
  mobilePhone?: string
  isActive?: boolean
}

export interface UpdatePatientDto {
  firstName?: string
  lastName?: string
  email?: string
  documentNumber?: string
  dateOfBirth?: Date | string
  address?: string
  homePhone?: string
  mobilePhone?: string
  isActive?: boolean
}

export interface PatientQueryDto {
  search?: string
  firstName?: string
  lastName?: string
  documentNumber?: string
  email?: string
  mobilePhone?: string
  isActive?: boolean
  page?: number
  limit?: number
}
