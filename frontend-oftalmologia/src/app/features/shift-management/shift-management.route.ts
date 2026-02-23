import type { Route } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'
import { PagesShiftManagementComponent } from './pages/pages-shift-management.component'

export const SHIFT_MANAGEMENT_ROUTES: Route[] = [
  {
    path: '',
    component: PagesShiftManagementComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'SHIFT_MANAGEMENT_MODULE.TITLE',
      permissions: [PERMISSION_IDS.SHIFT_MANAGEMENT],
    },
  },
]
