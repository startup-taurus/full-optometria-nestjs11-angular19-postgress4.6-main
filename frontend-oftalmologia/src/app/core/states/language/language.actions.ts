import { createAction, props } from '@ngrx/store'
import { LanguageCode } from '../../interfaces/ui/language.interface'

export const loadPreviewLanguage = createAction('Load Preview Language')

export const loadPreviewLanguageSuccess = createAction(
  'Load Preview Language Success',
  props<{ language: LanguageCode }>()
)

export const change = createAction(
  'Change Language',
  props<{ language: LanguageCode }>()
)
