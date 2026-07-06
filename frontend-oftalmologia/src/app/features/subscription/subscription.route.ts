import type { Route } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'
import { SubscriptionComponent } from './pages/subscription.component'

export const SUBSCRIPTION_ROUTES: Route[] = [
  {
    path: '',
    component: SubscriptionComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'SUBSCRIPTION.TITLE',
      permissions: [PERMISSION_IDS.SUBSCRIPTION],
    },
  },
]
