import { Injectable } from '@angular/core'
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router'
import { AuthenticationService } from '@core/services/api/auth.service'

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private _auth: AuthenticationService,
    private _router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const isLoggedIn = !this._auth.isLoggedOut()

    if (!isLoggedIn) {
      this._router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      })
      return false
    }

    if (state.url === '/auth/login') {
      this._router.navigateByUrl('/')
      return false
    }

    return true
  }
}
