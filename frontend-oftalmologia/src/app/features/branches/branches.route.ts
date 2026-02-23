import type { Route } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'
import { PagesBranchesComponent } from './pages/pages-branches.component'

export const BRANCHES_ROUTES: Route[] = [
  {
    path: '',
    component: PagesBranchesComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'BRANCHES_MODULE.TITLE',
      permissions: [PERMISSION_IDS.BRANCHES],
    },
  },
]
