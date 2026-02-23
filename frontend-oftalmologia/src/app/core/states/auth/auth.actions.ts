import { createAction, props } from '@ngrx/store'
import { User, UserLoginRequest } from '../../interfaces/api/user.interface'

// Sesión y Autenticación
const loadUserSession = createAction('[User] Load Session')

const preAuthenticateUser = createAction('[User] Pre-Authenticate')

const userAuthenticationRequest = createAction(
  '[User] Authentication Request',
  props<{ request: UserLoginRequest }>()
)

const userAuthenticationSuccess = createAction(
  '[User] Authentication Success',
  props<{ user: User }>()
)

const preAuthenticationSuccess = createAction(
  '[User] Pre-Authentication Success',
  props<{ user: User }>()
)

const userAuthenticationFailure = createAction(
  '[User] Authentication Failure',
  props<{ message: string }>()
)

const preAuthenticationFailure = createAction(
  '[User] Pre-Authentication Failure',
  props<{ message: string }>()
)

// Logout
const userLogout = createAction('[User] Logout')

const completeUserLogout = createAction('[User] Complete Logout')

// Perfil de Usuario
const requestUserProfileUpdate = createAction(
  '[User] Request Profile Update',
  props<{ user: FormData | any }>()
)

const userProfileUpdateSuccess = createAction(
  '[User] Profile Update Success',
  props<{ user: User }>()
)

const userProfileUpdateFailure = createAction(
  '[User] Profile Update Failure',
  props<{ message: string }>()
)

export const UserActions = {
  // Sesión y Autenticación
  loadUserSession,
  preAuthenticateUser,
  userAuthenticationRequest,
  userAuthenticationSuccess,
  preAuthenticationSuccess,
  userAuthenticationFailure,
  preAuthenticationFailure,

  // Logout
  userLogout,
  completeUserLogout,

  // Perfil de Usuario
  requestUserProfileUpdate,
  userProfileUpdateSuccess,
  userProfileUpdateFailure,
}
