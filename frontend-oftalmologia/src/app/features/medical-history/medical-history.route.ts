import type { Route } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'
import { PagesMedicalHistoryComponent } from './pages/pages-medical-history.component'

export const MEDICAL_HISTORY_ROUTES: Route[] = [
  {
    path: '',
    component: PagesMedicalHistoryComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'MEDICAL_HISTORY.TITLE',
      permissions: [PERMISSION_IDS.MEDICAL_HISTORY],
    },
  },
]
