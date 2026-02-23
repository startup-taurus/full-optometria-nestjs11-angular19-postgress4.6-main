import type { Route } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'
import { PagesCalendaryComponent } from './pages/pages-calendary.component'

export const CALENDARY_ROUTES: Route[] = [
  {
    path: '',
    component: PagesCalendaryComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'CALENDAR.TITLE',
      permissions: [PERMISSION_IDS.CALENDAR],
    },
  },
]
