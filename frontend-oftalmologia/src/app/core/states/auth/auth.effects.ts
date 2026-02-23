import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { AuthenticationService } from '@core/services/api/auth.service'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs'
import {
  USER_SESSION,
  USER_SESSION_PRE,
} from '../../helpers/global/global.constants'
import { UserService } from '../../services/api/user.service'
import { StorageService } from '../../services/ui/storage.service'
import { UserActions } from './auth.actions'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { TranslateService } from '@ngx-translate/core'
import { PermissionsService } from '../../services/api/permissions.service'
import { Store } from '@ngrx/store'
import { AppState } from '../'
import { BranchActions } from '../branch/branch.actions'

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private router: Router,
    private authService: AuthenticationService,
    private userService: UserService,
    private storageService: StorageService,
    private notificationService: ToastrNotificationService,
    private translate: TranslateService,
    private permissionsService: PermissionsService,
    private store: Store<AppState>
  ) {}

  loadUserSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUserSession),
      exhaustMap(() => this.loadUserSession())
    )
  )

  loginUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.userAuthenticationRequest),
      switchMap((action) => this.loginUser(action)),
      switchMap(() => this.reloadUserSessionAfterLogin())
    )
  )

  logoutUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.userLogout),
      switchMap(() => {
        this.authService.logout()
        return [UserActions.completeUserLogout()]
      })
    )
  )

  loadPermissionsAfterAuth$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UserActions.userAuthenticationSuccess),
        tap((action) => {
          this.permissionsService.forceReloadPermissions().subscribe()

          if (action.user?.branch?.id) {
            this.store.dispatch(BranchActions.initializeUserBranch({ userBranchId: action.user.branch.id }))
          }
        })
      ),
    { dispatch: false }
  )

  clearPermissionsOnLogout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UserActions.userLogout),
        tap(() => {
          this.permissionsService.clearPermissions()
        })
      ),
    { dispatch: false }
  )

  updateUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.requestUserProfileUpdate),
      map((action) => {
        return action.user
      }),
      switchMap((user) => {
        return this.userService.updateProfile(user).pipe(
          map((res) => {
            return UserActions.userProfileUpdateSuccess({ user: res.data })
          }),
          catchError((error) => {
            return of(
              UserActions.userProfileUpdateFailure({
                message: error.message,
              })
            )
          })
        )
      })
    )
  )

  private loadUserSession() {
    const storedSession = JSON.parse(
      this.storageService.secureStorage.getItem(USER_SESSION)
    )

    if (storedSession && this.authService.isLoggedIn()) {
      return this.authService.getMeUser().pipe(
        map((response) => {
          const user = response.data
          this.permissionsService.forceReloadPermissions().subscribe()
          return UserActions.userAuthenticationSuccess({ user })
        }),
        catchError((error) => {
          return of(
            UserActions.userAuthenticationFailure({
              message: `Failed to load session: ${error.message}`,
            })
          )
        })
      )
    } else {
      return of(
        UserActions.userAuthenticationFailure({
          message: 'User session not found or expired.',
        })
      )
    }
  }

  private loginUser(
    action: ReturnType<typeof UserActions.userAuthenticationRequest>
  ) {
    const { request } = action

    return this.authService.login(request).pipe(
      map((response) => {
        return UserActions.userAuthenticationSuccess({
          user: response.data.user,
        })
      }),
      catchError((error) =>
        of(
          UserActions.userAuthenticationFailure({
            message: `Login failed: ${error.message}`,
          })
        )
      )
    )
  }

  reloadUserSessionAfterLogin() {
    const storedSession =
      JSON.parse(this.storageService.secureStorage.getItem(USER_SESSION)) ||
      JSON.parse(this.storageService.secureStorage.getItem(USER_SESSION_PRE))

    if (storedSession) {
      return this.authService.getMeUser().pipe(
        map((response) => {
          const user = response.data
          this.router.navigate(['/dashboard'])
          this.permissionsService.forceReloadPermissions().subscribe()
          return UserActions.userAuthenticationSuccess({ user })
        }),
        catchError((error) => {
          return of(
            UserActions.userAuthenticationFailure({
              message: `Failed to load session: ${error.message}`,
            })
          )
        })
      )
    } else {
      return of(
        UserActions.userAuthenticationFailure({
          message: 'User session not found.',
        })
      )
    }
  }
}
