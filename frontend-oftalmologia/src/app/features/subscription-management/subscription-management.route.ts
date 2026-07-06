import type { Route } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { SubscriptionManagementComponent } from './pages/subscription-management.component'

export const SUBSCRIPTION_MANAGEMENT_ROUTES: Route[] = [
  {
    path: '',
    component: SubscriptionManagementComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'SUBSCRIPTION_ADMIN.TITLE',
      roles: ['SUPER_ADMIN'],
    },
  },
]
