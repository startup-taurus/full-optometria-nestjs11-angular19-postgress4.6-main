import type { Route } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'
import { PagesLaboratoryOrdersComponent } from './pages/pages-laboratory-orders.component'

export const LABORATORY_ORDERS_ROUTES: Route[] = [
  {
    path: '',
    component: PagesLaboratoryOrdersComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'LABORATORY_ORDERS_MODULE.TITLE',
      permissions: [PERMISSION_IDS.LABORATORY_ORDERS],
    },
  },
]
