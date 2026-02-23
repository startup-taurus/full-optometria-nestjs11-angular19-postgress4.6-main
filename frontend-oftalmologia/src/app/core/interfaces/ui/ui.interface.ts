import { BUTTON_ACTIONS } from '@core/helpers/ui/constants'

export type ButtonAction = (typeof BUTTON_ACTIONS)[keyof typeof BUTTON_ACTIONS]

export interface NgSelect<T> {
  value: T
  label: string
  icon?: string
}

export interface Select {
  label: string
  value: string
}

export type NgSelectQuery =
  (typeof NG_SELECT_QUERIES)[keyof typeof NG_SELECT_QUERIES]

export const NG_SELECT_QUERIES = {} as const

export const DEFAULT_SEARCH_NG_SELECT_TERM_DELAY = 1500
