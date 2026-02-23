export interface Module {
  id: string
  moduleName: string
  description?: string
  isActive: boolean
  isActiveForRole?: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}
