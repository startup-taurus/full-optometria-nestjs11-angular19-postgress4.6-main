import type { Route } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'
import { PurchaseOrdersPageComponent } from './pages/purchase-orders-page.component'

export const PURCHASE_ORDERS_ROUTES: Route[] = [
  {
    path: '',
    component: PurchaseOrdersPageComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'PURCHASE_ORDERS.MODULE',
      permissions: [PERMISSION_IDS.PURCHASE_ORDERS],
    },
  },
]
