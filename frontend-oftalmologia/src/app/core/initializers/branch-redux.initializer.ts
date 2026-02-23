import { inject } from '@angular/core'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { BranchActions } from '@core/states/branch/branch.actions'


export function branchReduxInitializerFactory(): () => Promise<void> {
  return async (): Promise<void> => {
    const store = inject(Store<AppState>)

    try {
    

      store.dispatch(BranchActions.initializeFromStorage())

   
    } catch (error) {
      console.error(
        '[BranchReduxInitializer] Error during initialization:',
        error
      )
    }
  }
}
