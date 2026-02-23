import { Injectable } from '@angular/core'
import { LanguageService } from './language.service'
import { ApiMessage } from '@core/interfaces/api/message.interface'
import { LOCAL_STORAGE_NAMES } from '@core/helpers/global/global.constants'

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor(private _languageService: LanguageService) {}

  public getLocalizedMessage(message: ApiMessage): string {
    if (typeof message === 'string') {
      return message
    }

    if (typeof message === 'object' && message) {
      const currentLanguage = localStorage.getItem(LOCAL_STORAGE_NAMES.LANGUAGE) || 'es'
      const msg = message as any
      return msg[currentLanguage] || msg['es'] || msg['en'] || Object.values(msg)[0] || ''
    }

    return ''
  }
}
