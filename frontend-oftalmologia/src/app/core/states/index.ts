import { ActionReducerMap } from '@ngrx/store'
import { UserState } from '../interfaces/api/user.interface'
import { LanguageState } from '../interfaces/ui/language.interface'
import { AuthEffects } from './auth/auth.effects'
import { authReducer } from './auth/auth.reducers'
import { LanguageEffects } from './language/language.effects'
import { languageReducer } from './language/language.reducers'
import { layoutReducer, LayoutState } from './layout/layout-reducers'
import { calendarReducer, CalendarState } from './calendar/calendar.reducer'
import { branchReducer, BranchState } from './branch/branch.reducers'
import { BranchEffects } from './branch/branch.effects'

export interface AppState {
  language: Readonly<LanguageState>
  auth: Readonly<UserState>
  layout: Readonly<LayoutState>
  Calendar: Readonly<CalendarState>
  branch: Readonly<BranchState>
}

export const ROOT_REDUCERS: ActionReducerMap<AppState> = {
  language: languageReducer,
  auth: authReducer,
  layout: layoutReducer,
  Calendar: calendarReducer,
  branch: branchReducer,
}

export const ROOT_EFFECTS = [LanguageEffects, AuthEffects, BranchEffects]
