import { Routes } from '@angular/router'
import { NotificationsComponent } from './pages/notifications.component'

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    component: NotificationsComponent,
    data: {
      title: 'NOTIFICATIONS.TITLE',
    },
  },
]
