import { Routes } from '@angular/router'
import { PatientComponent } from './pages/patient.component'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'

export const PATIENT_ROUTES: Routes = [
  {
    path: '',
    component: PatientComponent,
    canActivate: [PermissionsGuard],
    data: {
      requiredPermissions: [PERMISSION_IDS.PATIENTS],
    },
  },
]
