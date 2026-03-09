export type FeedbackType = 'suggestion' | 'report'
export type FeedbackStatus = 'nuevo' | 'en_revision' | 'resuelto'

export interface FeedbackAttachment {
  id: string
  originalName: string
  path: string
  mimeType: string
  size: number
}

export interface FeedbackItem {
  id: string
  title: string
  description: string
  type: FeedbackType
  status: FeedbackStatus
  companyId: string
  branchId?: string | null
  createdByUserId: string
  createdAt: string
  updatedAt: string
  company?: {
    id: string
    name: string
    code?: string
  }
  branch?: {
    id: string
    name: string
  }
  createdByUser?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  attachments?: FeedbackAttachment[]
  attachmentsCount?: number
}

export interface FeedbackQueryParams {
  page?: number
  limit?: number
  search?: string
  type?: FeedbackType | ''
  status?: FeedbackStatus | ''
  branchId?: string
  companyId?: string
  createdByUserId?: string
}
