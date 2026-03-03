import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { isBefore } from 'date-fns'
import {
  User,
  UserLoginRequest,
  LoginResponse,
} from '@core/interfaces/api/user.interface'
import { StorageService } from '../ui/storage.service'
import { Router } from '@angular/router'
import { environment } from '@environment/environment'
import { Observable, tap, BehaviorSubject, shareReplay } from 'rxjs'
import { ApiResponse } from '@core/interfaces/api/api-response.interface'
import { PlanQuota } from '@core/interfaces/api/company.interface'
import { USER_SESSION } from '@core/helpers/global/global.constants'
import * as CryptoJS from 'crypto-js'

const SESSION_LOCK_KEY = 'session_locked'
const LOCKED_USER_DATA_KEY = 'locked_user_data'
const STORAGE_KEY_USER = 'rememberedUser'
const STORAGE_KEY_PASS = 'rememberedPass'
const SECRET_KEY = 'baseProjectKey2025!'

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  public url: string
  private _currentUser$ = new BehaviorSubject<User | null>(null)
  private _getMeUserCache$: Observable<ApiResponse<User>> | null = null

  public currentUser$ = this._currentUser$.asObservable()

  constructor(
    private _http: HttpClient,
    private _storageService: StorageService,
    private router: Router
  ) {
    this.url = environment.apiBaseUrl + '/auth'
  }

  login = (
    request: UserLoginRequest
  ): Observable<ApiResponse<LoginResponse>> => {
    const endpoint = `${this.url}/login`
    const headers = new HttpHeaders({ skip: 'skip' })
    const options = { headers }
    return this._http
      .post<ApiResponse<LoginResponse>>(endpoint, request, options)
      .pipe(
        tap((response: ApiResponse<LoginResponse>) => {
          this._storageService.secureStorage.setItem(
            USER_SESSION,
            JSON.stringify(response.data)
          )
          sessionStorage.removeItem(SESSION_LOCK_KEY)
        })
      )
  }

  unlockScreen = (
    request: UserLoginRequest
  ): Observable<ApiResponse<LoginResponse>> => {
    const endpoint = `${this.url}/login`
    const headers = new HttpHeaders({ skip: 'skip' })
    const options = { headers }
    return this._http
      .post<ApiResponse<LoginResponse>>(endpoint, request, options)
      .pipe(
        tap((response: ApiResponse<LoginResponse>) => {
          this._storageService.secureStorage.setItem(
            USER_SESSION,
            JSON.stringify(response.data)
          )
          sessionStorage.removeItem(SESSION_LOCK_KEY)
        })
      )
  }

  public getMyQuota(): Observable<ApiResponse<PlanQuota>> {
    return this._http.get<ApiResponse<PlanQuota>>(`${this.url}/my-quota`)
  }

  public getMeUser(): Observable<ApiResponse<User>> {
    if (this._getMeUserCache$) {
      return this._getMeUserCache$
    }

    this._getMeUserCache$ = this._http
      .get<ApiResponse<User>>(`${this.url}/get-me-user`)
      .pipe(
        tap((response) => {
          if (response.data) {
            this._currentUser$.next(response.data)
          }
          setTimeout(() => {
            this._getMeUserCache$ = null
          }, 5000)
        }),
        shareReplay(1)
      )

    return this._getMeUserCache$
  }

  public getProfileWithPermissions(): Observable<ApiResponse<any>> {
    return this._http.get<ApiResponse<any>>(
      `${this.url}/profile-with-permissions`
    )
  }

  logout(): void {
    const preferredLanguage = localStorage.getItem('preferredLanguage')
    const themeColor = localStorage.getItem('HYPER_CONFIG_theme_color')
    const languageRedux = localStorage.getItem('language')

    this._storageService.secureStorage.removeItem(USER_SESSION)
    sessionStorage.removeItem(SESSION_LOCK_KEY)
    sessionStorage.removeItem(LOCKED_USER_DATA_KEY)
    sessionStorage.removeItem('admin-selected-branch-id')
    localStorage.removeItem('admin-selected-branch-id')

    localStorage.removeItem('remembered_user')
    localStorage.removeItem('remembered_pass')

    if (preferredLanguage) {
      localStorage.setItem('preferredLanguage', preferredLanguage)
    }
    if (themeColor) {
      localStorage.setItem('HYPER_CONFIG_theme_color', themeColor)
    }
    if (languageRedux) {
      localStorage.setItem('language', languageRedux)
    }

    this._currentUser$.next(null)
    this._getMeUserCache$ = null

    this.router.navigate([`/auth/login`])
  }

  public isLoggedIn(): boolean {
    const expirationDate = this.getExpiration()
    if (!expirationDate) {
      return false
    }
    return isBefore(new Date(), expirationDate)
  }

  isLoggedOut(): boolean {
    return !this.isLoggedIn()
  }

  getExpiration = () => {
    const session = JSON.parse(
      this._storageService.secureStorage.getItem(USER_SESSION)
    )
    if (!session) {
      return null
    }
    const { exp } = this._storageService.parseJwt(session.accessToken)
    return new Date(exp * 1000)
  }

  lockSession(userData?: User) {
    sessionStorage.setItem(SESSION_LOCK_KEY, 'true')
    
    if (userData) {
      try {
        sessionStorage.setItem(LOCKED_USER_DATA_KEY, JSON.stringify(userData))
      } catch (error) {
        console.error('Error saving locked user data:', error)
      }
    }
  }

  isLocked(): boolean {
    return sessionStorage.getItem(SESSION_LOCK_KEY) === 'true'
  }

  unlockSession() {
    sessionStorage.removeItem(SESSION_LOCK_KEY)
    sessionStorage.removeItem(LOCKED_USER_DATA_KEY)
  }

  getLockedUserData(): User | null {
    try {
      const userData = sessionStorage.getItem(LOCKED_USER_DATA_KEY)
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Error getting locked user data:', error)
      return null
    }
  }

  public clearUserCache(): void {
    this._getMeUserCache$ = null
    this._currentUser$.next(null)
  }

  public getCurrentUser(): User | null {
    return this._currentUser$.value
  }

  rememberUser(email: string, password: string) {
    localStorage.setItem(STORAGE_KEY_USER, email)
    const encryptedPass = CryptoJS.AES.encrypt(password, SECRET_KEY).toString()
    localStorage.setItem(STORAGE_KEY_PASS, encryptedPass)
  }

  getRememberedUser(): { identifier: string; password: string } | null {
    const identifier = localStorage.getItem(STORAGE_KEY_USER)
    const encryptedPass = localStorage.getItem(STORAGE_KEY_PASS)

    if (identifier && encryptedPass) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedPass, SECRET_KEY)
        const decryptedPass = bytes.toString(CryptoJS.enc.Utf8)
        return { identifier: identifier, password: decryptedPass }
      } catch (error) {
        return null
      }
    }
    return null
  }

  clearRememberedUser() {
    localStorage.removeItem(STORAGE_KEY_USER)
    localStorage.removeItem(STORAGE_KEY_PASS)
  }

  changePassword(changePasswordData: {
    currentPassword: string
    newPassword: string
  }): Observable<ApiResponse<any>> {
    return this._http.post<ApiResponse<any>>(
      `${this.url}/change-password`,
      changePasswordData
    )
  }

  forgotPassword(email: string): Observable<ApiResponse<any>> {
    return this._http.post<ApiResponse<any>>(`${this.url}/forgot-password`, {
      email,
    })
  }

  resetPassword(
    token: string,
    newPassword: string
  ): Observable<ApiResponse<any>> {
    return this._http.post<ApiResponse<any>>(`${this.url}/reset-password`, {
      token,
      newPassword,
    })
  }

  // Branch filtering methods for admin users
  setAdminBranchFilter(branchId: string): Observable<ApiResponse<any>> {
    return this._http.post<ApiResponse<any>>(
      `${this.url}/set-admin-branch-filter`,
      { branchId }
    )
  }

  clearAdminBranchFilter(): Observable<ApiResponse<any>> {
    return this._http.post<ApiResponse<any>>(
      `${this.url}/clear-admin-branch-filter`,
      {}
    )
  }
}
