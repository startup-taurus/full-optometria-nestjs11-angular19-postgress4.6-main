import { createReducer, on } from '@ngrx/store'
import { BranchActions } from './branch.actions'
import { Branch } from '../../interfaces/api/branch.interface'

export interface BranchState {
  selectedBranchId: string | null
  availableBranches: Branch[]
  isLoading: boolean
  error: string | null
}

export const initialBranchState: BranchState = {
  selectedBranchId: null,
  availableBranches: [],
  isLoading: false,
  error: null,
}

export const branchReducer = createReducer(
  initialBranchState,

  on(BranchActions.loadAvailableBranches, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(BranchActions.loadAvailableBranchesSuccess, (state, { branches }) => ({
    ...state,
    availableBranches: branches,
    isLoading: false,
    error: null,
  })),

  on(BranchActions.loadAvailableBranchesFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(BranchActions.setBranchFilter, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(BranchActions.setBranchFilterSuccess, (state, { branchId }) => ({
    ...state,
    selectedBranchId: branchId,
    isLoading: false,
    error: null,
  })),

  on(BranchActions.setBranchFilterFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(BranchActions.clearBranchFilter, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(BranchActions.clearBranchFilterSuccess, (state) => ({
    ...state,
    selectedBranchId: null,
    isLoading: false,
    error: null,
  })),

  on(BranchActions.clearBranchFilterFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(BranchActions.setBranchLoading, (state, { loading }) => ({
    ...state,
    isLoading: loading,
  })),

  on(BranchActions.initializeBranchState, (state) => {
    const savedBranchId =
      localStorage.getItem('admin-selected-branch-id') ||
      localStorage.getItem('admin-branch-filter')
    return {
      ...state,
      selectedBranchId: savedBranchId || null,
    }
  }),

  on(BranchActions.resetBranchState, () => ({
    ...initialBranchState,
  })),

  on(BranchActions.initializeUserBranch, (state, { userBranchId }) => ({
    ...state,
    // Keep persisted/manual selection if present; fallback to user default branch.
    selectedBranchId: state.selectedBranchId ?? userBranchId,
  }))
)
