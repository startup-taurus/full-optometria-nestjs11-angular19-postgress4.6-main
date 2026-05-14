import { Routes } from '@angular/router'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { PERMISSION_IDS } from '@core/constants/permissions.constants'
import { ClientsTableComponent } from './components/tables/clients-table.component'

export const CLIENTS_ROUTES: Routes = [
  {
    path: '',
    component: ClientsTableComponent,
    canActivate: [PermissionsGuard],
    data: {
      requiredPermissions: [PERMISSION_IDS.CLIENTS],
    },
  },
]
