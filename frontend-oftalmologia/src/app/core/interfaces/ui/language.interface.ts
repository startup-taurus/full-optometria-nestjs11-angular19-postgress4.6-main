import { AVAILABLE_LANGUAGES } from '@core/helpers/global/global.constants'

export type LanguageCode =
  (typeof AVAILABLE_LANGUAGES)[keyof typeof AVAILABLE_LANGUAGES]

export interface LanguageState {
  code: LanguageCode
}

export interface LanguageComponent {
  language: string
  code: LanguageCode
  type: string
  icon: string
}

export interface Language {
  _id: string
  name: string
  code: LanguageCode
}

export type TranslationsPerLanguage = {
  [key in LanguageCode]: string
}
