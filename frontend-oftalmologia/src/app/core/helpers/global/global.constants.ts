export const TOKEN_HEADER_KEY = 'Authorization'
export const USER_SESSION = 'USER_SESSION'
export const USER_SESSION_PRE = 'USER_SESSION_PRE'

export const LOCAL_STORAGE_NAMES = {
  LANGUAGE: 'preferredLanguage',
}

export const AVAILABLE_LANGUAGES = {
  ES: 'es',
  EN: 'en',
} as const

export const USER_SESSION_LOGIN = {
  USER: 'user',
} as const

export const BLOCKED_OPTIONS = [
  { value: true, label: 'true' },
  { value: false, label: 'false' },
]

export const ACTIVE_OPTIONS = [
  { value: true, label: 'WORDS.ACTIVE' },
  { value: false, label: 'WORDS.INACTIVE' },
]

export const MODAL_TYPE = {
  ROLE_FORM: 'role-form',
  MODULE_FORM: 'module-form',
  PERMISSION_FORM: 'permission-form',
}
