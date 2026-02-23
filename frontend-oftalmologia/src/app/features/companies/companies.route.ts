import type { Route } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { PagesCompaniesComponent } from './pages/pages-companies.component'

export const COMPANIES_ROUTES: Route[] = [
  {
    path: '',
    component: PagesCompaniesComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'COMPANIES_MODULE.TITLE',
      roles: ['SUPER_ADMIN'],
    },
  },
]
