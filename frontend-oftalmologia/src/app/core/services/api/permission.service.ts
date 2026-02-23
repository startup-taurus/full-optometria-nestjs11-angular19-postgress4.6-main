import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, Injector } from '@angular/core'
import { environment } from '@environment/environment'
import { ToastrNotificationService } from '../ui/notification.service'
import {
  ApiData,
  ApiResponse,
} from '@core/interfaces/api/api-response.interface'
import { map, Observable, tap, switchMap, catchError, of } from 'rxjs'
import { ApiMessage } from '@core/interfaces/api/message.interface'
import { Permission } from '@core/interfaces/api/permission.interface'

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  public API_URL = `${environment.apiBaseUrl}/permission`
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

  public createPermission(
    permission: object
  ): Observable<ApiResponse<Permission>> {
    const endpoint = `${this.API_URL}/create`
    return this._httpClient
      .post<ApiResponse<Permission>>(endpoint, permission)
      .pipe(
        tap((res) =>
          this.showNotification(
            res.message,
            'ROLES_AND_PERMISSIONS.PERMISSION.TITLE'
          )
        )
      )
  }

  public findPermissions(
    filter: object
  ): Observable<ApiResponse<ApiData<Permission[]>>> {
    const endpoint = `${this.API_URL}/get-all`
    const params = new HttpParams({ fromObject: { ...filter } })

    return this._httpClient.get<ApiResponse<ApiData<Permission[]>>>(endpoint, {
      params,
    })
  }

  public getPermissionById(id: string): Observable<ApiResponse<Permission>> {
    const endpoint = `${this.API_URL}/${id}`
    return this._httpClient.get<ApiResponse<Permission>>(endpoint)
  }

  public getPermissionsByRoleAndModule(
    roleId: string,
    moduleId: string,
    search?: string,
    page: number = 1,
    limit: number = 10
  ): Observable<ApiResponse<ApiData<Permission[]>>> {
    const endpoint = `${environment.apiBaseUrl}/role-permissions/role/${roleId}/module/${moduleId}`

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())

    if (search) {
      params = params.set('search', search)
    }

    return this._httpClient.get<ApiResponse<any>>(endpoint, { params }).pipe(
      map((response: any) => {
        if (response && response.data && response.data.result) {
          let permissions = response.data.result

          if (search && search.trim()) {
            permissions = permissions.filter((p: any) => 
              p.permissionName.toLowerCase().includes(search.toLowerCase()) ||
              (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
            )
          }

          const startIndex = (page - 1) * limit
          const endIndex = startIndex + limit
          const paginatedPermissions = permissions.slice(startIndex, endIndex)

          return {
            ...response,
            data: {
              result: paginatedPermissions,
              total: permissions.length,
              totalCount: permissions.length,
              currentPage: page,
              totalPages: Math.ceil(permissions.length / limit),
            },
          }
        }
        
        return {
          ...response,
          data: {
            result: [],
            total: 0,
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
          },
        }
      }),
      catchError(() => {
        return of({
          statusCode: 500,
          status: 'error',
          message: { es: 'Error al obtener permisos', en: 'Error fetching permissions' },
          data: {
            result: [],
            total: 0,
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
          },
        } as any)
      })
    )
  }

  public updatePermission(
    id: string,
    permission: object
  ): Observable<ApiResponse<Permission>> {
    const endpoint = `${this.API_URL}/update/${id}`
    return this._httpClient
      .patch<ApiResponse<Permission>>(endpoint, permission)
      .pipe(
        tap((res) =>
          this.showNotification(
            res.message,
            'ROLES_AND_PERMISSIONS.PERMISSION.TITLE'
          )
        )
      )
  }

  public deletePermission(id: string): Observable<ApiResponse<Permission>> {
    const endpoint = `${this.API_URL}/delete/${id}`
    return this._httpClient
      .delete<ApiResponse<Permission>>(endpoint)
      .pipe(
        tap((res) =>
          this.showNotification(
            res.message,
            'ROLES_AND_PERMISSIONS.PERMISSION.TITLE'
          )
        )
      )
  }

  public togglePermissionStatus(
    roleId: string,
    permissionId: string,
    currentStatus: boolean
  ): Observable<any> {
    const assignEndpoint = `${environment.apiBaseUrl}/role-permissions/assign`
    const removeEndpoint = `${environment.apiBaseUrl}/role-permissions/remove/${roleId}/${permissionId}`

    const requestObservable = currentStatus
      ? this._httpClient.delete(removeEndpoint)
      : this._httpClient.post(assignEndpoint, {
          roleId,
          permissionId,
          isEnabled: true,
        })

    return requestObservable.pipe(
      tap((res: any) => {
        this.showNotification(
          res.message ||
            ({ messageKey: 'Permiso actualizado correctamente' } as any),
          'ROLES_AND_PERMISSIONS.PERMISSION.TITLE'
        )
      }),
      catchError(() => {
        this.showNotification(
          { messageKey: 'Error al actualizar el permiso' } as any,
          'ROLES_AND_PERMISSIONS.PERMISSION.TITLE'
        )
        return of({ success: false })
      })
    )
  }

  private showNotification(
    message: ApiMessage,
    title: string = 'ROLES_AND_PERMISSIONS.PERMISSION.TITLE'
  ): void {
    this.notificationService.showNotification({
      title,
      message,
      type: 'success',
    })
  }
}
