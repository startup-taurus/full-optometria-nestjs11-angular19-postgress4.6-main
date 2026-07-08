import type { Route } from '@angular/router'
import { TutorialsComponent } from './pages/tutorials.component'

export const TUTORIALS_ROUTES: Route[] = [
  {
    path: '',
    component: TutorialsComponent,
    data: {
      title: 'TUTORIALS.PAGE.TITLE',
    },
  },
]
