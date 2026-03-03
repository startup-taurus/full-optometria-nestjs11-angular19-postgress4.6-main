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

        if (
          error.status === RESPONSE_CODES.UNAUTHORIZED ||
          error.status === 401
        ) {
          this._storageService.secureStorage.removeItem(USER_SESSION)
          this.router.navigate(['/auth/login'])
        } else if (error.status === RESPONSE_CODES.FORBIDDEN) {
          this.router.navigate(['/auth/account-deactivation'])
        }

        this._notificationService.showNotification({
          type: 'error',
          title: 'Error',
          message: errorMessage,
        })

        const errorMessageTranslated =
          this._notificationService.getMessageTest(errorMessage)

        return throwError(() => new Error(errorMessageTranslated))
      })
    )
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const fallback = this._translateService.instant('words.unknownError')
    const preferredLang = this._translateService.currentLang || 'es'
    const payload = error.error

    if (!payload) {
      return fallback
    }

    const payloadMessage = payload.message

    if (typeof payloadMessage === 'string' && payloadMessage.trim()) {
      return payloadMessage
    }

    if (Array.isArray(payloadMessage) && payloadMessage.length > 0) {
      const message = payloadMessage.find(
        (item) => typeof item === 'string' && item.trim()
      )
      if (message) {
        return message
      }
    }

    if (
      payloadMessage &&
      typeof payloadMessage === 'object' &&
      (payloadMessage.es || payloadMessage.en)
    ) {
      return (
        payloadMessage[preferredLang] ||
        payloadMessage.es ||
        payloadMessage.en ||
        fallback
      )
    }

    if (typeof payload.data?.error === 'string' && payload.data.error.trim()) {
      return payload.data.error
    }

    if (Array.isArray(payload.data?.details) && payload.data.details.length > 0) {
      const detail = payload.data.details.find(
        (item: unknown) => typeof item === 'string' && item.trim()
      )
      if (detail) {
        return detail
      }
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error
    }

    return fallback
  }
}
export const ERROR_INTERCEPTOR_PROVIDERS = [
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
]
