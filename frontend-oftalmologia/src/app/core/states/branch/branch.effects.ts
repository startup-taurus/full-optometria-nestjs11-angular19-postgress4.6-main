import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { of } from 'rxjs'
import { map, catchError, switchMap, tap, withLatestFrom } from 'rxjs/operators'
import { BranchActions } from './branch.actions'
import { UserActions } from '../auth/auth.actions'
import { AuthenticationService } from '../../services/api/auth.service'
import { BranchService } from '../../services/api/branch.service'
import { ToastrService } from 'ngx-toastr'
import { selectUser } from '../auth/auth.selectors'
import { AppState } from '..'

@Injectable()
export class BranchEffects {
  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private authService: AuthenticationService,
    private branchService: BranchService,
    private toastr: ToastrService
  ) {}

  // Cargar sucursales disponibles
  loadAvailableBranches$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BranchActions.loadAvailableBranches),
      switchMap(() =>
        this.branchService.getAllBranchesForSelector().pipe(
          map((branches) =>
            BranchActions.loadAvailableBranchesSuccess({ branches })
          ),
          catchError((error) =>
            of(
              BranchActions.loadAvailableBranchesFailure({
                error: error.message || 'Error loading branches',
              })
            )
          )
        )
      )
    )
  )

  // Establecer filtro de sucursal
  setBranchFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BranchActions.setBranchFilter),
      withLatestFrom(this.store.select(selectUser)),
      switchMap(([action, user]) => {
        // Any role can persist and use the selected branch locally.
        if (!user?.isAdmin) {
          return of(
            BranchActions.setBranchFilterSuccess({ branchId: action.branchId })
          )
        }

        return this.authService.setAdminBranchFilter(action.branchId).pipe(
          map(() =>
            BranchActions.setBranchFilterSuccess({ branchId: action.branchId })
          ),
          catchError((error) =>
            of(
              BranchActions.setBranchFilterFailure({
                error: error.message || 'Error setting branch filter',
              })
            )
          )
        )
      })
    )
  )

  clearBranchFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BranchActions.clearBranchFilter),
      withLatestFrom(this.store.select(selectUser)),
      switchMap(([, user]) => {
        if (!user?.isAdmin) {
          return of(BranchActions.clearBranchFilterSuccess())
        }

        return this.authService.clearAdminBranchFilter().pipe(
          map(() => BranchActions.clearBranchFilterSuccess()),
          catchError((error) =>
            of(
              BranchActions.clearBranchFilterFailure({
                error: error.message || 'Error clearing branch filter',
              })
            )
          )
        )
      })
    )
  )

  persistBranchFilter$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BranchActions.setBranchFilterSuccess),
        tap(({ branchId }) => {
          localStorage.setItem('admin-selected-branch-id', branchId)
          // Backward compatibility with older storage key used in initializer.
          localStorage.setItem('admin-branch-filter', branchId)
        })
      ),
    { dispatch: false }
  )

  clearPersistedBranchFilter$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BranchActions.clearBranchFilterSuccess),
        tap(() => {
          localStorage.removeItem('admin-selected-branch-id')
          localStorage.removeItem('admin-branch-filter')
        })
      ),
    { dispatch: false }
  )

  showSuccessToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BranchActions.setBranchFilterSuccess),
        withLatestFrom(this.store.select(selectUser)),
        tap(([action]) => {
          this.toastr.success(
            `Filtrando datos de sucursal seleccionada`,
            'Filtro aplicado'
          )
        })
      ),
    { dispatch: false }
  )

  showClearToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BranchActions.clearBranchFilterSuccess),
        withLatestFrom(this.store.select(selectUser)),
        tap(([, user]) => {
          const userBranchName = user?.branch?.name || 'Mi sucursal'
          this.toastr.success(
            `Mostrando datos de: ${userBranchName}`,
            'Filtro eliminado'
          )
        })
      ),
    { dispatch: false }
  )

  showErrorToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          BranchActions.setBranchFilterFailure,
          BranchActions.clearBranchFilterFailure,
          BranchActions.loadAvailableBranchesFailure
        ),
        tap(({ error }) => {
          this.toastr.error(error, 'Error')
        })
      ),
    { dispatch: false }
  )

  initializeFromStorage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BranchActions.initializeFromStorage),
        tap(() => {
          try {
            const storedBranchId =
              localStorage.getItem('admin-selected-branch-id') ||
              localStorage.getItem('admin-branch-filter')
            if (storedBranchId) {
              this.store.dispatch(
                BranchActions.setBranchFilterSuccess({ branchId: storedBranchId })
              )
            } else {
            }
          } catch (error) {
            console.error(
              '[BranchEffects] Error reading from localStorage:',
              error
            )
          }
        })
      ),
    { dispatch: false }
  )

  resetBranchState$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BranchActions.resetBranchState),
        tap(() => {
          localStorage.removeItem('admin-selected-branch-id')
          localStorage.removeItem('admin-branch-filter')
        })
      ),
    { dispatch: false }
  )

  resetOnLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.userLogout),
      map(() => BranchActions.resetBranchState())
    )
  )

  reloadOnLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.userAuthenticationSuccess),
      withLatestFrom(this.store.select(selectUser)),
      switchMap(([, user]) => {
        const actions = []
        
        actions.push(BranchActions.loadAvailableBranches())
        
        if (user?.branch?.id) {
          actions.push(BranchActions.initializeUserBranch({ userBranchId: user.branch.id }))
        }
        
        return actions
      })
    )
  )
}
