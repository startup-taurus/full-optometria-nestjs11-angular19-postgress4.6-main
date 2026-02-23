import { Routes } from '@angular/router'
import { AuthLayoutComponent } from './shared/components/layouts/auth-layout/auth-layout.component'
import { LayoutComponent } from './shared/components/layouts/layout/layout.component'
import { AuthGuard } from '@core/guards/auth.guard'
import { LoginGuard } from '@core/guards/login.guard'
import { LockScreenGuard } from '@core/guards/lock-screen.guard'
import { AppInitGuard } from '@core/guards/app-init.guard'
import { RootRedirectGuard } from '@core/guards/root-redirect.guard'

export const routes: Routes = [
  {
    path: 'catalog/:companyName',
    loadComponent: () =>
      import('./features/public/public-catalog/public-catalog.component').then(
        (m) => m.PublicCatalogComponent
      ),
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./features/public/public-catalog/public-catalog.component').then(
        (m) => m.PublicCatalogComponent
      ),
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    loadChildren: () =>
      import('./features/auth/auth.route').then((mod) => mod.AUTH_ROUTES),
    canActivate: [LoginGuard],
  },
  {
    path: '',
    component: LayoutComponent,
    loadChildren: () =>
      import('./features/views.route').then((mod) => mod.VIEWS_ROUTES),
    canActivate: [RootRedirectGuard, AppInitGuard, AuthGuard, LockScreenGuard],
  },
  {
    path: '**',
    redirectTo: 'catalog',
    pathMatch: 'full',
  },
]
