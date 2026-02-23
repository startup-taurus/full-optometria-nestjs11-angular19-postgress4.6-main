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
export class RootRedirectGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (state.url === '/' || state.url === '') {
      const isLoggedIn = this.authService.isLoggedIn()
      
      if (isLoggedIn) {
        this.router.navigate(['/dashboard'])
        return false
      } else {
        this.router.navigate(['/catalog'])
        return false
      }
    }
    
    return true
  }
}
