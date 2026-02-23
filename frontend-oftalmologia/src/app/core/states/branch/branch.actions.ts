import { createAction, props } from '@ngrx/store'
import { Branch } from '../../interfaces/api/user.interface'

// Cargar sucursales disponibles
export const loadAvailableBranches = createAction(
  '[Branch] Load Available Branches'
)

export const loadAvailableBranchesSuccess = createAction(
  '[Branch] Load Available Branches Success',
  props<{ branches: Branch[] }>()
)

export const loadAvailableBranchesFailure = createAction(
  '[Branch] Load Available Branches Failure',
  props<{ error: string }>()
)

// Filtrado de sucursales para admin
export const setBranchFilter = createAction(
  '[Branch] Set Branch Filter',
  props<{ branchId: string }>()
)

export const setBranchFilterSuccess = createAction(
  '[Branch] Set Branch Filter Success',
  props<{ branchId: string }>()
)

export const setBranchFilterFailure = createAction(
  '[Branch] Set Branch Filter Failure',
  props<{ error: string }>()
)

export const clearBranchFilter = createAction('[Branch] Clear Branch Filter')

export const clearBranchFilterSuccess = createAction(
  '[Branch] Clear Branch Filter Success'
)

export const clearBranchFilterFailure = createAction(
  '[Branch] Clear Branch Filter Failure',
  props<{ error: string }>()
)

export const setBranchLoading = createAction(
  '[Branch] Set Loading',
  props<{ loading: boolean }>()
)

// Inicialización
export const initializeBranchState = createAction('[Branch] Initialize State')

export const initializeFromStorage = createAction(
  '[Branch] Initialize From Storage'
)

export const resetBranchState = createAction('[Branch] Reset State')

export const initializeUserBranch = createAction(
  '[Branch] Initialize User Branch',
  props<{ userBranchId: string | null }>()
)

export const BranchActions = {
  // Cargar sucursales
  loadAvailableBranches,
  loadAvailableBranchesSuccess,
  loadAvailableBranchesFailure,

  // Filtrado
  setBranchFilter,
  setBranchFilterSuccess,
  setBranchFilterFailure,
  clearBranchFilter,
  clearBranchFilterSuccess,
  clearBranchFilterFailure,

  // Estado
  setBranchLoading,
  initializeBranchState,
  initializeFromStorage,
  resetBranchState,
  initializeUserBranch,
}
