import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, map, tap, catchError, of } from 'rxjs'
import { Store } from '@ngrx/store'
import { environment } from '@environment/environment'
import { ApiResponse } from '@core/interfaces/api/api-response.interface'
import { Branch } from '@core/interfaces/api/branch.interface'
import { AppState } from '@core/states'
import { BranchActions } from '@core/states/branch/branch.actions'
import {
  selectBranchFilterState,
  selectAvailableBranches,
  selectShouldLoadBranches,
  selectHasActiveBranchFilter,
} from '@core/states/branch/branch.selectors'

export interface BranchFilterState {
  isAdmin: boolean
  isSuperAdmin: boolean
  currentUser: any | null
  selectedBranchId: string | null
  selectedBranch: Branch | null
  availableBranches: Branch[]
  isLoading: boolean
}

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private readonly url = `${environment.apiBaseUrl}/branches`
  private store = inject(Store<AppState>)

  constructor(private _http: HttpClient) {
    this.store.dispatch(BranchActions.initializeBranchState())
  }

  getAllBranches(): Observable<Branch[]> {
    return this._http.get<ApiResponse<any>>(`${this.url}/get-all`).pipe(
      tap((response) => {}),
      map((response) => response.data?.data?.result || []),
      catchError((error: any) => {
        return of([])
      })
    )
  }

  getBranchById(id: string): Observable<Branch | null> {
    return this._http.get<ApiResponse<any>>(`${this.url}/${id}`).pipe(
      map((response) => response.data?.data || response.data || null),
      catchError((error: any) => {
        return of(null)
      })
    )
  }

  getAllBranchesForSelector(): Observable<Branch[]> {
    return this._http
      .get<ApiResponse<any>>(`${this.url}/get-all-selector`)
      .pipe(
        map((response) => response.data?.data || []),
        catchError((error: any) => {
          return of([])
        })
      )
  }

  getBranchFilterState(): Observable<BranchFilterState> {
    return this.store.select(selectBranchFilterState)
  }

  setAdminBranchFilter(branchId: string): Observable<ApiResponse<any>> {
    this.store.dispatch(BranchActions.setBranchFilter({ branchId }))

    return of({ statusCode: 200, status: 'success' } as ApiResponse<any>)
  }

  clearAdminBranchFilter(): Observable<ApiResponse<any>> {
    this.store.dispatch(BranchActions.clearBranchFilter())

    return of({ statusCode: 200, status: 'success' } as ApiResponse<any>)
  }

  loadBranchesIfNeeded(): void {
    this.store
      .select(selectShouldLoadBranches)
      .pipe(
        tap((shouldLoad) => {
          if (shouldLoad) {
            this.store.dispatch(BranchActions.loadAvailableBranches())
          }
        })
      )
      .subscribe()
  }

  initialize(): Observable<void> {
    this.loadBranchesIfNeeded()
    return of(void 0)
  }

  hasActiveBranchFilter(): Observable<boolean> {
    return this.store.select(selectHasActiveBranchFilter)
  }

  getAvailableBranches(): Observable<Branch[]> {
    return this.store.select(selectAvailableBranches)
  }

  clearState(): void {
    this.store.dispatch(BranchActions.clearBranchFilter())
  }

  get selectedBranchId$() {
    return this.store
      .select(selectBranchFilterState)
      .pipe(map((state) => state.selectedBranchId))
  }

  get availableBranches$() {
    return this.store.select(selectAvailableBranches)
  }

  get isLoading$() {
    return this.store
      .select(selectBranchFilterState)
      .pipe(map((state) => state.isLoading))
  }
}
