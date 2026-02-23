import { Injectable } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { ToastrService } from 'ngx-toastr'
import { DEFAULT_GLOBAL_TOASTR_CONFIG } from '@core/helpers/ui/ui.constants'
import { ApiMessage } from '@core/interfaces/api/message.interface'
import { ToastrNotification } from '@core/interfaces/ui/notification.interface'
import { MessageService } from './message.service'

@Injectable({
  providedIn: 'root',
})
export class ToastrNotificationService {
  constructor(
    private _toastrService: ToastrService,
    private _translateService: TranslateService,
    private _messageService: MessageService
  ) {}

  public showNotification(notification: ToastrNotification): void {
    const { type, message, title, config } = notification
    const titleText = title ? this._translateService.instant(title) : ''
    const messageText = this.getMessageTest(message)
    const configFormatted = { ...DEFAULT_GLOBAL_TOASTR_CONFIG, ...config }
    this._toastrService[type](messageText, titleText, configFormatted)
  }

  public getMessageTest(message: ApiMessage): string {
    if (typeof message === 'string') {
      const translatedMessage = this._translateService.instant(message)
      return translatedMessage !== message ? translatedMessage : message
    }

    return this._messageService.getLocalizedMessage(message)
  }
}
