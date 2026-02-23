import { inject } from '@angular/core'
import { AuthenticationService } from '../services/api/auth.service'
import { PermissionsService } from '../services/api/permissions.service'
import { firstValueFrom } from 'rxjs'

export function permissionsInitializerFactory() {
  const authService = inject(AuthenticationService)
  const permissionsService = inject(PermissionsService)

  return () => {
    if (!authService.isLoggedIn()) {
      return Promise.resolve(true)
    }

    return firstValueFrom(permissionsService.loadUserPermissions())
      .then((success) => {
        return new Promise(resolve => {
          setTimeout(() => resolve(success), 100)
        })
      })
      .catch((error) => {
        return true
      })
  }
}
