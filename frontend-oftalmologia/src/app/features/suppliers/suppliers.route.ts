import { Routes } from '@angular/router'
import { SuppliersComponent } from './pages/suppliers.component'

export const SUPPLIERS_ROUTES: Routes = [
  {
    path: '',
    component: SuppliersComponent,
    data: {
      title: 'SUPPLIERS.TITLE',
      requiredPermission: '0ec24ecf-9cde-445c-afc7-dde23f7d7477',
    },
  },
]
