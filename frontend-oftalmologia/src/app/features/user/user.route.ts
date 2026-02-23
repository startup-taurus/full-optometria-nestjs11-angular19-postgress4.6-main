import type { Route } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { UserComponent } from './pages/user.component'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'

export const USER_ROUTES: Route[] = [
  {
    path: 'users',
    component: UserComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'SIDEBAR.USERS',
      permissions: [PERMISSION_IDS.USERS],
    },
  },
]
