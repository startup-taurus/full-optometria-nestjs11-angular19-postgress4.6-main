import { Injectable } from '@angular/core'
import { CanActivate, Router } from '@angular/router'
import { Observable, of } from 'rxjs'
import { map, catchError, tap } from 'rxjs/operators'
import { AuthenticationService } from '../services/api/auth.service'
import { PermissionsService } from '../services/api/permissions.service'

@Injectable({
  providedIn: 'root',
})
export class AppInitGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private permissionsService: PermissionsService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login'])
      return false
    }

    if (this.permissionsService.isLoaded()) {
      return true
    }

    return this.permissionsService.loadUserPermissions().pipe(
      map((success) => {
        if (success) {
          return true
        } else {
          this.authService.logout()
          return false
        }
      }),
      catchError((error) => {
        this.authService.logout()
        return of(false)
      })
    )
  }
}
