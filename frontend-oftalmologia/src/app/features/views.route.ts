import type { Route } from '@angular/router'
import { BlockedComponent } from './auth/pages/blocked/blocked.component'

export const VIEWS_ROUTES: Route[] = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.route').then((mod) => mod.DASHBOARD_ROUTES),
  },
  {
    path: 'users-management',
    loadChildren: () =>
      import('./user/user.route').then((mod) => mod.USER_ROUTES),
  },
  {
    path: 'patients',
    loadChildren: () =>
      import('./patient/patient.route').then((mod) => mod.PATIENT_ROUTES),
  },
  {
    path: 'system-management',
    loadChildren: () =>
      import('./system-management/system-management.route').then(
        (mod) => mod.SYSTEM_MANAGEMENT_ROUTES
      ),
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./profile/profile.route').then((mod) => mod.PROFILE_ROUTES),
  },
  {
    path: 'inventory',
    loadChildren: () =>
      import('./inventory/inventory.route').then((mod) => mod.INVENTORY_ROUTES),
  },
  {
    path: 'medical-history',
    loadChildren: () =>
      import('./medical-history/medical-history.route').then(
        (mod) => mod.MEDICAL_HISTORY_ROUTES
      ),
  },
  {
    path: 'medical-history-configuration',
    loadChildren: () =>
      import(
        './medical-history-configuration/medical-history-config.route'
      ).then((mod) => mod.MEDICAL_HISTORY_CONFIGURATION_ROUTES),
  },
  {
    path: 'shift-management',
    loadChildren: () =>
      import('./shift-management/shift-management.route').then(
        (mod) => mod.SHIFT_MANAGEMENT_ROUTES
      ),
  },
  {
    path: 'branches',
    loadChildren: () =>
      import('./branches/branches.route').then((mod) => mod.BRANCHES_ROUTES),
  },
  {
    path: 'calendar',
    loadChildren: () =>
      import('./calendary/calendary.route').then((mod) => mod.CALENDARY_ROUTES),
  },
  {
    path: 'laboratory-orders',
    loadChildren: () =>
      import('./laboratoy-orders/laboratory-orders.route').then(
        (mod) => mod.LABORATORY_ORDERS_ROUTES
      ),
  },
  {
    path: 'suppliers',
    loadChildren: () =>
      import('./suppliers/suppliers.route').then((mod) => mod.SUPPLIERS_ROUTES),
  },
  {
    path: 'categories',
    loadChildren: () =>
      import('./categories/categories.route').then(
        (mod) => mod.CATEGORIES_ROUTES
      ),
  },
  {
    path: 'companies',
    loadChildren: () =>
      import('./companies/companies.route').then((mod) => mod.COMPANIES_ROUTES),
  },
]
