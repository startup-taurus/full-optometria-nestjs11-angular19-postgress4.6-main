import type { Route } from '@angular/router'
import { LoginComponent } from './pages/login/login.component'
import { BlockedComponent } from './pages/blocked/blocked.component'
import { LockScreenComponent } from './pages/lock-screen/lock-screen.component'
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component'
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component'

export const AUTH_ROUTES: Route[] = [
  {
    path: 'login',
    component: LoginComponent,
    data: { title: 'Login' },
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    data: { title: 'Forgot Password' },
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    data: { title: 'Reset Password' },
  },
  {
    path: 'account-deactivation',
    component: BlockedComponent,
    data: { title: 'Account Deactivation' },
  },
  {
    path: 'lock-screen',
    component: LockScreenComponent,
    data: { title: 'Lock Screen' },
  },
]
