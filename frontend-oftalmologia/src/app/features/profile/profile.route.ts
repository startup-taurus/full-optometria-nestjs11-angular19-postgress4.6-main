import type { Route } from '@angular/router'
import { ProfileComponent } from './pages/profile.component'

export const PROFILE_ROUTES: Route[] = [
  {
    path: '',
    component: ProfileComponent,
    data: { title: 'PROFILE.TITLE' },
  },
]
