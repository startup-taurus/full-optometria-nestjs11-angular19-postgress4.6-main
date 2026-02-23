import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, Injector } from '@angular/core'
import { environment } from '@environment/environment'
import { ToastrNotificationService } from '../ui/notification.service'
import {
  ApiData,
  ApiResponse,
} from '@core/interfaces/api/api-response.interface'
import { Observable, tap } from 'rxjs'
import { ApiMessage } from '@core/interfaces/api/message.interface'

@Injectable({
  providedIn: 'root',
})
export class RolePermissionService {
  private API_URL = `${environment.apiBaseUrl}/role-permissions`
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

  public assignPermissionToRole(assignData: {
    roleId: string
    permissionId: string
    isEnabled?: boolean
  }): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/assign`
    return this._httpClient
      .post<ApiResponse<any>>(endpoint, {
        roleId: assignData.roleId,
        permissionId: assignData.permissionId,
        isEnabled: assignData.isEnabled ?? true
      })
      .pipe(
        tap((res) =>
          this.showNotification(res.message, 'ROLES_AND_PERMISSIONS.TITLE')
        )
      )
  }

  public removePermissionFromRole(
    roleId: string,
    permissionId: string
  ): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/remove/${roleId}/${permissionId}`
    return this._httpClient.delete<ApiResponse<any>>(endpoint).pipe(
      tap((res) =>
        this.showNotification(res.message, 'ROLES_AND_PERMISSIONS.TITLE')
      )
    )
  }

  public getRolePermissions(roleId: string): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/role/${roleId}`
    return this._httpClient.get<ApiResponse<any>>(endpoint)
  }

  public getAllRolePermissions(): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/all`
    return this._httpClient.get<ApiResponse<any>>(endpoint)
  }

  private showNotification(
    message: ApiMessage,
    title: string = 'ROLES_AND_PERMISSIONS.TITLE'
  ): void {
    this.notificationService.showNotification({
      title,
      message,
      type: 'success',
    })
  }
}
