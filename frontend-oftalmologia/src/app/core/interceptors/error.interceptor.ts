import {
  HTTP_INTERCEPTORS,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { RESPONSE_CODES } from '@core/helpers/global/auth.constants'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { TranslateService } from '@ngx-translate/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { StorageService } from '@core/services/ui/storage.service'
import { USER_SESSION } from '@core/helpers/global/global.constants'

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private _notificationService: ToastrNotificationService,
    private _translateService: TranslateService,
    private router: Router,
    private _storageService: StorageService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.extractErrorMessage(error)
        const shouldNotify = !this.isExpectedQuickStockNotFound(req, error)

        if (
          error.status === RESPONSE_CODES.UNAUTHORIZED ||
          error.status === 401
        ) {
          this._storageService.secureStorage.removeItem(USER_SESSION)
          this.router.navigate(['/auth/login'])
        } else if (error.status === RESPONSE_CODES.FORBIDDEN) {
          this.router.navigate(['/auth/account-deactivation'])
        }

        if (shouldNotify) {
          this._notificationService.showNotification({
            type: 'error',
            title: 'Error',
            message: errorMessage,
          })
        }

        const errorMessageTranslated =
          this._notificationService.getMessageTest(errorMessage)

        const propagatedError = {
          ...error,
          status: error.status,
          statusCode: error.status,
          translatedMessage: errorMessageTranslated,
          originalError: error,
        }

        return throwError(() => propagatedError)
      })
    )
  }

  private isExpectedQuickStockNotFound(
    req: HttpRequest<any>,
    error: HttpErrorResponse
  ): boolean {
    return req.url.includes('/products/by-code/') && error.status === 404
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const fallback = this._translateService.instant('words.unknownError')
    // Prefer localStorage as source of truth over currentLang (which may be undefined at startup)
    const preferredLang =
      localStorage.getItem('preferredLanguage') ||
      this._translateService.currentLang ||
      'es'
    const payload = error.error

    if (!payload) {
      return fallback
    }

    // 1. localizedMessage: objeto { es, en } serializado desde el backend — máxima precisión
    if (
      payload.data?.localizedMessage &&
      typeof payload.data.localizedMessage === 'object'
    ) {
      const lm = payload.data.localizedMessage as Record<string, string>
      return lm[preferredLang] || lm['es'] || lm['en'] || fallback
    }

    // 2. data.error: string ya procesado (puede ser "es / en" para mensajes bilingüe)
    if (typeof payload.data?.error === 'string' && payload.data.error.trim()) {
      const raw = payload.data.error
      // Si contiene " / " y hay mensaje en español/inglés, separar por idioma
      if (raw.includes(' / ')) {
        const parts = raw.split(' / ')
        return preferredLang === 'en' ? (parts[1]?.trim() || parts[0]?.trim()) : parts[0]?.trim()
      }
      return raw
    }

    // 3. data.details: array de strings con detalle de validación
    if (Array.isArray(payload.data?.details) && payload.data.details.length > 0) {
      const detail = payload.data.details.find(
        (item: unknown) => typeof item === 'string' && (item as string).trim()
      )
      if (detail) return detail
    }

    const payloadMessage = payload.message

    // 4. message como string
    if (typeof payloadMessage === 'string' && payloadMessage.trim()) {
      return payloadMessage
    }

    // 5. message como array
    if (Array.isArray(payloadMessage) && payloadMessage.length > 0) {
      const message = payloadMessage.find(
        (item) => typeof item === 'string' && item.trim()
      )
      if (message) return message
    }

    // 6. message como objeto { es, en }
    if (
      payloadMessage &&
      typeof payloadMessage === 'object' &&
      !Array.isArray(payloadMessage)
    ) {
      const msg = payloadMessage as Record<string, string>
      if (msg[preferredLang] || msg['es'] || msg['en']) {
        return msg[preferredLang] || msg['es'] || msg['en'] || fallback
      }
    }

    // 7. payload.error como string de último recurso
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error
    }

    return fallback
  }
}
export const ERROR_INTERCEPTOR_PROVIDERS = [
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
]
