import { createFeatureSelector, createSelector } from '@ngrx/store'
import { BranchState } from './branch.reducers'
import { selectUser } from '../auth/auth.selectors'

// Feature selector
export const selectBranchState = createFeatureSelector<BranchState>('branch')

// Basic selectors
export const selectSelectedBranchId = createSelector(
  selectBranchState,
  (state) => state.selectedBranchId
)

export const selectAvailableBranches = createSelector(
  selectBranchState,
  (state) => state.availableBranches
)

export const selectBranchLoading = createSelector(
  selectBranchState,
  (state) => state.isLoading
)

export const selectBranchError = createSelector(
  selectBranchState,
  (state) => state.error
)

// Computed selectors
export const selectSelectedBranch = createSelector(
  selectBranchState,
  (state) => {
    if (!state.selectedBranchId || !state.availableBranches.length) {
      return null
    }
    return (
      state.availableBranches.find(
        (branch) => branch.id === state.selectedBranchId
      ) || null
    )
  }
)

export const selectHasActiveBranchFilter = createSelector(
  selectSelectedBranchId,
  (branchId) => branchId !== null
)

// Estado completo del filtro de sucursales (similar al BranchFilterState actual)
export const selectBranchFilterState = createSelector(
  selectUser,
  selectSelectedBranchId,
  selectSelectedBranch,
  selectAvailableBranches,
  selectBranchLoading,
  (
    currentUser,
    selectedBranchId,
    selectedBranch,
    availableBranches,
    isLoading
  ) => ({
    isAdmin: currentUser?.isAdmin || false,
    isSuperAdmin: currentUser?.role?.roleName === 'SUPER_ADMIN',
    currentUser,
    selectedBranchId,
    selectedBranch,
    availableBranches,
    isLoading,
  })
)

export const selectBranchIdForInterceptor = createSelector(
  selectUser,
  selectSelectedBranchId,
  (user, selectedBranchId) => {

    if (selectedBranchId) {
      return selectedBranchId
    }
    return null
  }
)

export const selectShouldLoadBranches = createSelector(
  selectUser,
  selectAvailableBranches,
  selectBranchLoading,
  (user, branches, loading) => {
    return branches.length === 0 && !loading
  }
)
