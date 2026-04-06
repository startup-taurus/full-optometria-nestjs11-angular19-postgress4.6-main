import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { environment } from '@environment/environment'

@Injectable({
  providedIn: 'root',
})
export class ApiBaseUrlInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (this.isAbsoluteUrl(req.url) || !this.isRelativeApiUrl(req.url)) {
      return next.handle(req)
    }

    const normalizedPath = req.url.replace(/^\/?api/, '')
    const rewrittenUrl = `${environment.apiBaseUrl}${normalizedPath}`

    return next.handle(
      req.clone({
        url: rewrittenUrl,
      })
    )
  }

  private isAbsoluteUrl(url: string): boolean {
    return /^https?:\/\//i.test(url)
  }

  private isRelativeApiUrl(url: string): boolean {
    return /^\/?api\//i.test(url)
  }
}

export const API_BASE_URL_INTERCEPTOR_PROVIDERS = [
  { provide: HTTP_INTERCEPTORS, useClass: ApiBaseUrlInterceptor, multi: true },
]
