import type { Route } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'
import { PagesInventoryComponent } from './pages/pages-inventory.component'

export const INVENTORY_ROUTES: Route[] = [
  {
    path: '',
    component: PagesInventoryComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'INVENTORY.TITLE',
      permissions: [PERMISSION_IDS.INVENTORY],
    },
  },
]
