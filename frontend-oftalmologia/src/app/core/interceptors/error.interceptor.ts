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
        const hasCustomBilingualMessage =
          !!error.error?.message &&
          typeof error.error.message === 'object' &&
          (error.error.message.es || error.error.message.en)

        if (hasCustomBilingualMessage) {
          const preferredLang = this._translateService.currentLang || 'es'
          const bilingualMessage =
            error.error.message[preferredLang] ||
            error.error.message.es ||
            error.error.message.en ||
            this._translateService.instant('words.unknownError')

          this._notificationService.showNotification({
            type: 'error',
            title: 'Error',
            message: bilingualMessage,
          })

          return throwError(() => new Error(bilingualMessage))
        }

        let errorMessage = this._translateService.instant('words.unknownError')

        if (error.error && error.error.message) {
          errorMessage = error.error.message
        }

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
}
export const ERROR_INTERCEPTOR_PROVIDERS = [
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
]
