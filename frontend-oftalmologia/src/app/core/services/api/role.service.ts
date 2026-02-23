import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, Injector } from '@angular/core'
import { environment } from '@environment/environment'
import { ToastrNotificationService } from '../ui/notification.service'
import {
  ApiData,
  ApiResponse,
} from '@core/interfaces/api/api-response.interface'
import { Observable, tap, switchMap } from 'rxjs'
import { ApiMessage } from '@core/interfaces/api/message.interface'
import { Role } from '@core/interfaces/api/role.interface'

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private API_URL = `${environment.apiBaseUrl}/roles`
  private _notificationService!: ToastrNotificationService

  constructor(
    private _httpClient: HttpClient,
    private injector: Injector
  ) {}

  private get notificationService(): ToastrNotificationService {
    if (!this._notificationService) {
      this._notificationService = this.injector.get(ToastrNotificationService)
    }
    return this._notificationService
  }

  public createRole(role: Role): Observable<ApiResponse<Role>> {
    const endpoint = `${this.API_URL}/create`
    return this._httpClient
      .post<ApiResponse<Role>>(endpoint, role)
      .pipe(
        tap((res) =>
          this.showNotification(res.message, 'ROLES_AND_PERMISSIONS.ROLE.TITLE')
        )
      )
  }

  public getAllRoles(
    search?: string,
    page: number = 1,
    limit: number = 10
  ): Observable<ApiResponse<ApiData<Role[]>>> {
    const endpoint = `${this.API_URL}/get-all`

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())

    if (search) {
      params = params.set('search', search)
    }

    return this._httpClient.get<ApiResponse<ApiData<Role[]>>>(endpoint, {
      params,
    })
  }

  public getRoleById(id: string): Observable<ApiResponse<Role>> {
    const endpoint = `${this.API_URL}/${id}`
    return this._httpClient.get<ApiResponse<Role>>(endpoint)
  }

  public updateRole(
    id: string,
    role: Partial<Role>
  ): Observable<ApiResponse<Role>> {
    const endpoint = `${this.API_URL}/update/${id}`
    return this._httpClient
      .patch<ApiResponse<Role>>(endpoint, role)
      .pipe(
        tap((res) =>
          this.showNotification(res.message, 'ROLES_AND_PERMISSIONS.ROLE.TITLE')
        )
      )
  }

  public deleteRole(id: string): Observable<ApiResponse<Role>> {
    const endpoint = `${this.API_URL}/delete/${id}`
    return this._httpClient
      .delete<ApiResponse<Role>>(endpoint)
      .pipe(
        tap((res) =>
          this.showNotification(res.message, 'ROLES_AND_PERMISSIONS.ROLE.TITLE')
        )
      )
  }

  public getActiveRoles(): Observable<ApiResponse<Role[]>> {
    const endpoint = `${this.API_URL}/get-all`
    const params = new HttpParams().set('isActive', 'true')
    return this._httpClient.get<ApiResponse<Role[]>>(endpoint, { params })
  }

  public toggleRoleStatus(id: string): Observable<ApiResponse<Role>> {
    return this.getRoleById(id).pipe(
      switchMap((roleResponse: ApiResponse<Role>) => {
        const currentRole = roleResponse.data
        const updatedRole = {
          roleName: currentRole.roleName,
          description: currentRole.description,
          isActive: !currentRole.isActive,
        }
        return this.updateRole(id, updatedRole)
      })
    )
  }

  private showNotification(
    message: ApiMessage,
    title: string = 'ROLES_AND_PERMISSIONS.ROLE.TITLE'
  ): void {
    this.notificationService.showNotification({
      title,
      message,
      type: 'success',
    })
  }
}
