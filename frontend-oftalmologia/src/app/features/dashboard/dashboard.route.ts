import type { Route } from '@angular/router'
import { DashboardComponent } from './pages/dashboard.component'

export const DASHBOARD_ROUTES: Route[] = [
  {
    path: '',
    component: DashboardComponent,
    data: { title: 'DASHBOARD.TITLE' },
  },
]
