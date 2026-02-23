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
export class LockScreenGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const isLocked = this.authService.isLocked()
    const isLoggedIn = this.authService.isLoggedIn()

    if (state.url === '/auth/lock-screen' && !isLocked && !isLoggedIn) {
      this.router.navigate(['/auth/login'])
      return false
    }

    if (isLocked && state.url !== '/auth/lock-screen') {
      this.router.navigate(['/auth/lock-screen'])
      return false
    }

    return true
  }
}
