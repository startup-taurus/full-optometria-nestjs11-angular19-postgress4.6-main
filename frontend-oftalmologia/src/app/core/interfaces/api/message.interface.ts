import { TranslationsPerLanguage } from '../ui/language.interface'

export interface MsgTranslate {
  es: string
  en: string
}

export type ApiMessage = string | TranslationsPerLanguage | MsgTranslate
