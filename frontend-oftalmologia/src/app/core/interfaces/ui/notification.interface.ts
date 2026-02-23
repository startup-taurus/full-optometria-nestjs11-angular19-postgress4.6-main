import { IndividualConfig } from 'ngx-toastr'
import { ApiMessage } from '../api/message.interface'

export interface ToastrNotification {
  type: 'success' | 'error' | 'info' | 'warning'
  message: ApiMessage
  title?: string
  config?: Partial<IndividualConfig<any>>
}
