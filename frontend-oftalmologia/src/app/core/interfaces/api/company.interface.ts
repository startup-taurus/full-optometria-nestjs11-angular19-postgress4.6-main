export interface PlanQuota {
  usersCount: number
  maxUsers: number | null
  branchesCount: number
  maxBranches: number | null
}

export interface Company {
  id: string
  name: string
  code: string
  email?: string
  phone?: string
  slug?: string
  logoFileId?: string
  logoFile?: {
    id: string
    filename: string
    path: string
    mimeType: string
  }
  isActive: boolean
  maxUsers?: number | null
  maxBranches?: number | null
  billingApiKey?: string | null
  billingContributorId?: number | null
  usersCount?: number
  branchesCount?: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateCompanyDto {
  name: string
  code: string
  email?: string
  phone?: string
  slug?: string
  logoFileId?: string
  maxUsers?: number | null
  maxBranches?: number | null
  billingApiKey?: string
  billingContributorId?: number | null
}

export interface CreateCompanyCompleteDto {
  name: string
  code: string
  companyEmail?: string
  companyPhone?: string
  slug?: string
  maxUsers?: number | null
  maxBranches?: number | null
  branchName: string
  branchCode: string
  branchAddress: string
  branchCity: string
  username: string
  email: string
  firstName: string
  lastName: string
  password: string
  documentNumber: string
  mobilePhone: string
}

export interface UpdateCompanyDto {
  name?: string
  code?: string
  email?: string
  phone?: string
  slug?: string
  logoFileId?: string
  isActive?: boolean
  maxUsers?: number | null
  maxBranches?: number | null
  billingApiKey?: string
  billingContributorId?: number | null
}

export interface QueryCompanyDto {
  page?: number
  limit?: number
  search?: string
  name?: string
  code?: string
  isActive?: boolean
}

export interface CompanyCompleteResponse {
  company: Company
  role: {
    id: string
    roleName: string
    description?: string
  }
  branch: {
    id: string
    name: string
    code: string
  }
  user: {
    id: string
    username: string
    email: string
    firstName: string
    lastName: string
  }
}
