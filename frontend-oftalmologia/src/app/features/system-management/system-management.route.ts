import type { Route } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { RolesAndPermissionsComponent } from './pages/roles-and-permissions/roles-and-permissions.component'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'
import { FeedbackAdminComponent } from '../feedback/pages/feedback-admin.component'

export const SYSTEM_MANAGEMENT_ROUTES: Route[] = [
  {
    path: 'roles-and-permissions',
    component: RolesAndPermissionsComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'ROLES_AND_PERMISSIONS.TITLE',
      permissions: [PERMISSION_IDS.ROLES],
    },
  },
  {
    path: 'feedback',
    component: FeedbackAdminComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'FEEDBACK.ADMIN_TITLE',
      roles: ['SUPER_ADMIN'],
    },
  },
]
