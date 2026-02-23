import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HTTP_INTERCEPTORS,
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { MessageService } from '@core/services/ui/message.service'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class ResponseInterceptor implements HttpInterceptor {
  constructor(private _messageService: MessageService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          const body = event.body
          if (body && body.message && this.isMultiLanguageMessage(body.message)) {
            const localizedMessage = this._messageService.getLocalizedMessage(body.message)
            
            const modifiedBody = {
              ...body,
              message: localizedMessage,
            }

            return event.clone({ body: modifiedBody })
          }
        }
        return event
      })
    )
  }

  private isMultiLanguageMessage(message: any): boolean {
    return (
      message &&
      typeof message === 'object' &&
      !Array.isArray(message) &&
      (message.hasOwnProperty('es') || message.hasOwnProperty('en'))
    )
  }
}

export const RESPONSE_INTERCEPTOR_PROVIDERS = [
  { provide: HTTP_INTERCEPTORS, useClass: ResponseInterceptor, multi: true },
]
