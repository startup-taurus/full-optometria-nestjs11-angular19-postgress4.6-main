export interface Plan {
  id: string
  code: string
  name: string
  description?: string | null
  amountCents: number
  currency: string
  billingCycle: string
  maxUsers?: number | null
  maxBranches?: number | null
  isActive: boolean
}

export interface CompanySubscription {
  id: string
  companyId: string
  planId?: string | null
  planCode?: string | null
  externalSubscriptionId?: string | null
  status: string
  billingCycle?: string | null
  amountCents?: number | null
  currency?: string | null
  cardBrand?: string | null
  cardLast4?: string | null
  currentPeriodEnd?: string | null
  startedAt?: string | null
  canceledAt?: string | null
  lastSyncedAt?: string | null
  metadata?: Record<string, unknown> | null
  createdAt?: string
  updatedAt?: string
  plan?: Plan | null
}

export interface AdminSubscriptionCompany {
  id: string
  name: string
  code: string
  email?: string | null
  phone?: string | null
  isActive: boolean
  logoFile?: { id?: string; path?: string } | null
}

export interface AdminSubscriptionInfo {
  id: string
  status: string
  planId?: string | null
  planCode?: string | null
  planName?: string | null
  amountCents?: number | null
  currency?: string | null
  billingCycle?: string | null
  currentPeriodEnd?: string | null
  cardBrand?: string | null
  cardLast4?: string | null
  externalSubscriptionId?: string | null
  source: 'landing' | 'manual'
  startedAt?: string | null
  canceledAt?: string | null
  lastSyncedAt?: string | null
}

export interface AdminSubscriptionRow {
  company: AdminSubscriptionCompany
  subscription: AdminSubscriptionInfo | null
  billingNotified?: boolean | null
}

export interface ListSubscriptionsQuery {
  page?: number
  limit?: number
  search?: string
  status?: string
  source?: 'landing' | 'manual' | ''
  active?: boolean | ''
}

export interface ManageSubscriptionPayload {
  planCode?: string
  status?: string
  currentPeriodEnd?: string
  amountCents?: number
  billingCycle?: string
  currency?: string
}
