import { Routes } from '@angular/router'
import { FeedbackComponent } from './pages/feedback.component'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'

export const FEEDBACK_ROUTES: Routes = [
  {
    path: '',
    component: FeedbackComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'FEEDBACK.TITLE',
      permissions: [PERMISSION_IDS.FEEDBACK],
    },
  },
]
