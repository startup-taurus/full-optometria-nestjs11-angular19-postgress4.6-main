import type { Route } from '@angular/router';
import { PermissionsGuard } from '@core/guards/permissions.guard';
import { PagesMedicalHistoryConfigurationComponent } from './pages/pages-medical-history-configuration.component';
import { PERMISSION_IDS } from '@core/constants/permissions.constants';

export const MEDICAL_HISTORY_CONFIGURATION_ROUTES: Route[] = [
  {
    path: '',
    component: PagesMedicalHistoryConfigurationComponent,
    canActivate: [PermissionsGuard],
    data: {
      title: 'MEDICAL_HISTORY_CONFIG.TITLE',
      permissions: [PERMISSION_IDS.MEDICAL_HISTORY_CONFIGURATION],
    },
  },
];
