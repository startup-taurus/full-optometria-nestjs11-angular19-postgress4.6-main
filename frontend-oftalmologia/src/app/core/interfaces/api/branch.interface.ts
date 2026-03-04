import { BranchOpeningScheduleDay } from '../../helpers/branch-schedule.helper'

export interface Branch {
  id: string
  name: string
  code: string
  address: string
  city: string
  phone?: string
  corporateEmail?: string
  openingHours?: string
  openingSchedule?: BranchOpeningScheduleDay[]
  isActive: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
  companyId?: string
  company?: {
    id: string
    name: string
    code?: string
    email?: string
    phone?: string
    logoFileId?: string
    isActive?: boolean
  }
}

export interface CreateBranchDto {
  companyId: string
  name: string
  code: string
  address: string
  city: string
  phone?: string
  corporateEmail?: string
  openingHours?: string
  openingSchedule?: BranchOpeningScheduleDay[]
}

export interface UpdateBranchDto {
  name?: string
  code?: string
  address?: string
  city?: string
  phone?: string
  corporateEmail?: string
  openingHours?: string
  openingSchedule?: BranchOpeningScheduleDay[]
  isActive?: boolean
}

export interface QueryBranchDto {
  page?: number
  limit?: number
  search?: string
  name?: string
  code?: string
  city?: string
  phone?: string
  corporateEmail?: string
  address?: string
  isActive?: boolean
}
