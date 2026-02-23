import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { Router } from '@angular/router'
import { StorageService } from '../services/ui/storage.service'
import {
  USER_SESSION,
  TOKEN_HEADER_KEY,
} from '@core/helpers/global/global.constants'

@Injectable({
  providedIn: 'root',
})
export class AuthTokenInterceptor implements HttpInterceptor {
  constructor(
    private _storageService: StorageService,
    private router: Router
  ) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.headers.get('skip')) {
      return next.handle(req)
    } else {
      const session = JSON.parse(
        this._storageService.secureStorage.getItem(USER_SESSION)
      )
      let authReq = req
      const token = session?.accessToken
      if (token != null) {
        authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`),
        })
        return next.handle(authReq)
      } else {
        return next.handle(authReq)
      }
    }
  }
}

export const AUTH_TOKEN_INTERCEPTOR_PROVIDERS = [
  { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true },
]
