import { MsgTranslate } from './message.interface'

export interface ApiResponse<T> {
  statusCode: number
  status: string
  message: MsgTranslate
  data: T
}

export interface ApiData<T> {
  result: T
  totalCount: number
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}
