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
export class LoginGuard implements CanActivate {
  constructor(
    private _auth: AuthenticationService,
    private _router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const isLoggedIn = this._auth.isLoggedIn()

    if (isLoggedIn && state.url !== '/auth/lock-screen') {
      this._router.navigateByUrl('/')
      return false
    }

    return true
  }
}
