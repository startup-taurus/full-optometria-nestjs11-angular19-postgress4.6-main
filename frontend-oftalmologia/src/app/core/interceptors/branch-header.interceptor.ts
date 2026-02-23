import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HTTP_INTERCEPTORS,
} from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, switchMap, of, take, distinctUntilChanged } from 'rxjs'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { selectBranchIdForInterceptor } from '@core/states/branch/branch.selectors'
import { PermissionsService } from '@core/services/api/permissions.service'

@Injectable({
  providedIn: 'root',
})
export class BranchHeaderInterceptor implements HttpInterceptor {
  private permissionsService = inject(PermissionsService)
  private store = inject(Store<AppState>)

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const excludedRoutes = [
      '/auth/',
      '/roles/',
      '/permission/',
      '/module/',
      '/files/',
      '/branches/',
      '/public/',
    ]

    const shouldExclude = excludedRoutes.some((excludedRoute) =>
      req.url.includes(excludedRoute)
    )

    if (shouldExclude) {
      return next.handle(req)
    }

    return this.store.select(selectBranchIdForInterceptor).pipe(
      take(1),
      distinctUntilChanged(),
      switchMap((selectedBranchId) => {
        if (selectedBranchId) {
          const modifiedReq = req.clone({
            headers: req.headers.set('x-admin-branch-id', selectedBranchId),
          })
          return next.handle(modifiedReq)
        }

        return next.handle(req)
      })
    )
  }
}

export const BRANCH_HEADER_INTERCEPTOR_PROVIDERS = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: BranchHeaderInterceptor,
    multi: true,
  },
]
