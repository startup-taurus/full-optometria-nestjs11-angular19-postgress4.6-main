import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, Injector } from '@angular/core'
import { environment } from '@environment/environment'
import { ToastrNotificationService } from '../ui/notification.service'
import {
  ApiData,
  ApiResponse,
} from '@core/interfaces/api/api-response.interface'
import { map, Observable, tap, catchError } from 'rxjs'
import { ApiMessage } from '@core/interfaces/api/message.interface'
import { User } from '@core/interfaces/api/user.interface'

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public API_URL = `${environment.apiBaseUrl}/user`

  constructor(
    private _httpClient: HttpClient,
    private injector: Injector,
    private _notificationService: ToastrNotificationService
  ) {}

  private get notificationService(): ToastrNotificationService {
    if (!this._notificationService) {
      this._notificationService = this.injector.get(ToastrNotificationService)
    }
    return this._notificationService
  }

  public createUser(user: object): Observable<ApiResponse<User>> {
    const endpoint = `${this.API_URL}/create`
    return this._httpClient.post<ApiResponse<User>>(endpoint, user)
  }

  public findUsers(filter: object): Observable<ApiResponse<ApiData<User[]>>> {
    const endpoint = `${this.API_URL}/get-all`

    const convertedFilter: { [key: string]: string } = {}
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'isActive' || key === 'isLocked') {
          convertedFilter[key] =
            value === true || value === 'true' ? 'true' : 'false'
        } else {
          convertedFilter[key] = String(value)
        }
      }
    })

    const params = new HttpParams({ fromObject: convertedFilter })

    return this._httpClient
      .get<ApiResponse<ApiData<User[]>>>(endpoint, {
        params,
      })
      .pipe(
        tap({
          next: (response) => {},
          error: () => {},
        })
      )
  }

  public updateProfile(user: FormData | object): Observable<ApiResponse<User>> {
    const endpoint = `${this.API_URL}/update/current`

    return this._httpClient.patch<ApiResponse<User>>(endpoint, user).pipe(
      tap((res) => {
        this.showNotification(res.message, 'PROFILE.TITLE')
      }),
      catchError((error) => {
        throw error
      })
    )
  }

  public validateCurrentPassword(
    currentPassword: string
  ): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/validate-current-password`
    return this._httpClient
      .post<ApiResponse<any>>(endpoint, { currentPassword })
      .pipe(
        catchError((error) => {
          throw error
        })
      )
  }

  public changePassword(passwordData: {
    currentPassword: string
    newPassword: string
  }): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/update/current`
    return this._httpClient
      .patch<ApiResponse<any>>(endpoint, passwordData)
      .pipe(
        catchError((error) => {
          throw error
        })
      )
  }

  // public setUserPassword(
  //   id: string,
  //   newPassword: string
  // ): Observable<ApiResponse<User>> {
  //   // Note: change-password endpoint doesn't exist in backend
  //   // This would need to be implemented in backend or use update endpoint
  //   const endpoint = `${this.API_URL}/update/${id}`
  //   return this._httpClient
  //     .patch<ApiResponse<User>>(endpoint, { password: newPassword })
  //     .pipe(tap((res) => this.showNotification(res.message)))
  // }

  public updateUser(id: string, user: object): Observable<ApiResponse<User>> {
    const endpoint = `${this.API_URL}/update/${id}`
    return this._httpClient
      .patch<ApiResponse<User>>(endpoint, user)
      .pipe(tap((res) => this.showNotification(res.message, 'USER.TITLE')))
  }

  public getUserById(id: string): Observable<ApiResponse<User>> {
    const endpoint = `${this.API_URL}/${id}`

    return this._httpClient.get<ApiResponse<User>>(endpoint).pipe(
      tap({
        next: (response) => {},
        error: (error) => {},
      })
    )
  }

  public deleteUser(id: string): Observable<ApiResponse<User>> {
    const endpoint = `${this.API_URL}/delete/${id}`
    return this._httpClient
      .delete<ApiResponse<User>>(endpoint)
      .pipe(tap((res) => this.showNotification(res.message, 'USER.TITLE')))
  }

  public searchUsers(query: string): Observable<ApiResponse<User[]>> {
    const endpoint = `${this.API_URL}/search`
    const params = new HttpParams().set('q', query)

    return this._httpClient.get<ApiResponse<User[]>>(endpoint, { params }).pipe(
      tap((response) =>
        console.log('gg:')
      ),
      catchError((error) => {
        throw error
      })
    )
  }

  public getUsersByBranch(
    branchId?: string,
    search?: string
  ): Observable<User[]> {
    const filter: any = {
      isActive: true,
      limit: 100,
      page: 1,
    }

    if (branchId) {
      filter.branchId = branchId
    }

    if (search && search.length >= 2) {
      filter.search = search
    }

    return this.findUsers(filter).pipe(
      map((response: ApiResponse<ApiData<User[]>>) => {
        if (response.data && response.data.result) {
          return response.data.result
        }
        return []
      }),
      catchError((error) => {
        return []
      })
    )
  }

  private showNotification(
    message: ApiMessage,
    title: string = 'profile.title'
  ): void {
    this._notificationService.showNotification({
      title,
      message,
      type: 'success',
    })
  }
}
