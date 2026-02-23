type CurrencyType = '₹' | '$' | '€'

export const currency: CurrencyType = '$'

export const currentYear = new Date().getFullYear()

export const credits = {
  year: new Date().getFullYear(),
  name: 'Oftalmología',
  company: 'ZGames',
}

export const TIMEOUTS = {
  TIMEOUT_DURATION: 10 * 60 * 1000,
  WARINING_DURATION: 15 * 1000,
}

export const BUTTON_ACTIONS = {
  ACCEPT: 'accept',
  ADD: 'add',
  CANCEL: 'cancel',
  COPY: 'copy',
  CREATE: 'create',
  CSV: 'csv',
  DELETE: 'delete',
  EDIT: 'edit',
  EXCEL: 'excel',
  FILTER: 'filter',
  RELOAD: 'reload',
  RESET: 'reset',
  RESOURCE: 'resource',
  RESTORE: 'restore',
  SAVE: 'save',
  STATS: 'stats',
  UPDATE: 'update',
  VIEW: 'view',
  REJECT: 'reject',
  PROCESS: 'process',
  STATE: 'state',
} as const

export const basePath: string = '/'
