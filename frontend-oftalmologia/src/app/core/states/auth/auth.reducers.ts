import { createReducer, on } from '@ngrx/store'
import { UserActions } from './auth.actions'
import { UserState } from '../../interfaces/api/user.interface'

export const initialUserState: UserState = {
  user: null, // TODO: change to profile
  message: null,
  loading: false,
}

export const authReducer = createReducer(
  initialUserState,

  // Sesión y Autenticación
  on(UserActions.loadUserSession, (state) => ({
    ...state,
    loading: true,
    message: 'Loading user session...',
  })),
  on(UserActions.userAuthenticationRequest, (state) => ({
    ...state,
    loading: true,
    message: 'Authenticating user...',
  })),
  on(UserActions.userAuthenticationSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    message: 'Authentication successful.',
  })),
  on(UserActions.userAuthenticationFailure, (state, { message }) => ({
    ...state,
    loading: false,
    message: `Authentication failed: ${message}`,
  })),

  // Logout
  on(UserActions.userLogout, (state) => ({
    ...state,
    loading: true,
    message: 'Logging out...',
  })),
  on(UserActions.completeUserLogout, () => ({
    ...initialUserState,
    message: 'User logged out successfully.',
  })),

  // User Profile
  on(UserActions.requestUserProfileUpdate, (state) => ({
    ...state,
    loading: true,
    message: 'Updating user profile...',
  })),
  on(UserActions.userProfileUpdateSuccess, (state, { user }) => {
    return {
      ...state,
      user,
      loading: false,
      message: 'Profile updated successfully.',
    };
  }),

  on(UserActions.userProfileUpdateFailure, (state, { message }) => ({
    ...state,
    loading: false,
    message: `Failed to update profile: ${message}`,
  }))
)

export const preAuthReducer = createReducer(
  initialUserState,
  // Pre-autenticación
  on(UserActions.preAuthenticateUser, (state) => ({
    ...state,
    loading: true,
    message: 'Pre-authenticating user...',
  })),
  on(UserActions.preAuthenticationSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    message: 'Pre-authentication successful.',
  })),
  on(UserActions.preAuthenticationFailure, (state, { message }) => ({
    ...state,
    loading: false,
    message: `Pre-authentication failed: ${message}`,
  }))
)
