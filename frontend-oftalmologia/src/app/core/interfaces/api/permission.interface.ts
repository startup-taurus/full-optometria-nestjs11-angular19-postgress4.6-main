import { Module } from './module.interface'

export interface Permission {
  id: string
  permissionName: string
  description?: string
  isActive: boolean
  moduleId: string
  module?: Module
  isActiveForRole?: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}
