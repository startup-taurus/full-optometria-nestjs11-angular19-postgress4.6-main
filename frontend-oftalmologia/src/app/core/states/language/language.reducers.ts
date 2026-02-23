import { createReducer, on } from '@ngrx/store'
import { LanguageState } from '../../interfaces/ui/language.interface'
import { change, loadPreviewLanguageSuccess } from './language.actions'
import {
  AVAILABLE_LANGUAGES,
  LOCAL_STORAGE_NAMES,
} from '@core/helpers/global/global.constants'

const initialState: LanguageState = {
  code: AVAILABLE_LANGUAGES.ES,
}

export const languageReducer = createReducer(
  initialState,
  on(loadPreviewLanguageSuccess, (state, { language }) => ({
    ...state,
    code: language,
  })),
  on(change, (state, { language }) => {
    localStorage.setItem(LOCAL_STORAGE_NAMES.LANGUAGE, language)
    return { ...state, code: language }
  })
)
