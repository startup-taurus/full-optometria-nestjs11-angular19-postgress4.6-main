export type WhatsAppSessionStatus = 'disconnected' | 'qr_ready' | 'connected'

export interface WhatsAppSession {
  id: string
  companyId?: string | null
  branchId?: string | null
  sessionKey: string
  status: WhatsAppSessionStatus
  qrCode?: string | null
  connectedPhone?: string | null
  lastConnectedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface ReminderRule {
  id: string
  companyId?: string | null
  branchId?: string | null
  isActive: boolean
  appointmentReminderHoursBefore: number
  renewalAfterDays: number
  renewalNotifyBeforeDays: number
  quietHoursStart: string
  quietHoursEnd: string
  createdAt: string
  updatedAt: string
}

export interface RenewalEligiblePatient {
  patientId: string
  firstName: string
  lastName: string
  documentNumber: string
  phone: string
  lastReferenceDate: string
  renewalDate: string
  daysUntilRenewal: number
  isDueSoon: boolean
}

export interface QueryRenewalEligible {
  page?: number
  limit?: number
  search?: string
  includeAll?: boolean
}
