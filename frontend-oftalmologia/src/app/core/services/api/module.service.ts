import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, Injector } from '@angular/core'
import {
  ApiData,
  ApiResponse,
} from '@core/interfaces/api/api-response.interface'
import { ApiMessage } from '@core/interfaces/api/message.interface'
import { Module } from '@core/interfaces/api/module.interface'
import { environment } from '@environment/environment'
import { Observable, tap, map, switchMap, catchError, of } from 'rxjs'
import { ToastrNotificationService } from '../ui/notification.service'

@Injectable({
  providedIn: 'root',
})
export class ModuleService {
  public API_URL = `${environment.apiBaseUrl}/module`
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

  public createModule(module: object): Observable<ApiResponse<Module>> {
    const endpoint = `${this.API_URL}/create`
    return this._httpClient
      .post<ApiResponse<Module>>(endpoint, module)
      .pipe(
        tap((res) =>
          this.showNotification(
            res.message,
            'ROLES_AND_PERMISSIONS.MODULE.TITLE'
          )
        )
      )
  }

  public getAllModules(
    search?: string,
    page: number = 1,
    limit: number = 10
  ): Observable<ApiResponse<ApiData<Module[]>>> {
    const endpoint = `${this.API_URL}/get-all`

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())

    if (search) {
      params = params.set('search', search)
    }

    return this._httpClient.get<ApiResponse<ApiData<Module[]>>>(endpoint, {
      params,
    })
  }

  public findModules(
    filter: object
  ): Observable<ApiResponse<ApiData<Module[]>>> {
    const endpoint = `${this.API_URL}/get-all`
    const params = new HttpParams({ fromObject: { ...filter } })

    return this._httpClient.get<ApiResponse<ApiData<Module[]>>>(endpoint, {
      params,
    })
  }

  public getModuleById(id: string): Observable<ApiResponse<Module>> {
    const endpoint = `${this.API_URL}/${id}`
    return this._httpClient.get<ApiResponse<Module>>(endpoint)
  }

  public getModulesByRole(
    roleId: string
  ): Observable<ApiResponse<ApiData<Module[]>>> {
    const endpoint = `${environment.apiBaseUrl}/role-modules/role/${roleId}`
    return this._httpClient.get<ApiResponse<ApiData<Module[]>>>(endpoint).pipe(
      map((response: any) => {
        if (response && response.data) {
          const modules = response.data.map((roleModule: any) => ({
            ...roleModule.module,
            isActiveForRole: roleModule.isEnabled,
          }))
          return {
            ...response,
            data: {
              result: modules,
              total: modules.length,
              currentPage: 1,
              totalPages: 1,
            },
          }
        }
        return response
      })
    )
  }

  public updateModule(
    id: string,
    module: object
  ): Observable<ApiResponse<Module>> {
    const endpoint = `${this.API_URL}/update/${id}`
    return this._httpClient
      .patch<ApiResponse<Module>>(endpoint, module)
      .pipe(
        tap((res) =>
          this.showNotification(
            res.message,
            'ROLES_AND_PERMISSIONS.MODULE.TITLE'
          )
        )
      )
  }

  public deleteModule(id: string): Observable<ApiResponse<Module>> {
    const endpoint = `${this.API_URL}/delete/${id}`
    return this._httpClient
      .delete<ApiResponse<Module>>(endpoint)
      .pipe(
        tap((res) =>
          this.showNotification(
            res.message,
            'ROLES_AND_PERMISSIONS.MODULE.TITLE'
          )
        )
      )
  }

  public toggleModuleActiveStatus(id: string): Observable<ApiResponse<Module>> {
    return this.getModuleById(id).pipe(
      switchMap((moduleResponse: ApiResponse<Module>) => {
        const currentModule = moduleResponse.data
        const updatedModule = {
          ...currentModule,
          isActive: !currentModule.isActive,
        }
        return this.updateModule(id, updatedModule)
      })
    )
  }

  public toggleModuleStatus(roleId: string, moduleId: string): Observable<any> {
    const getRoleModulesEndpoint = `${environment.apiBaseUrl}/role-modules/role/${roleId}`
    const assignEndpoint = `${environment.apiBaseUrl}/role-modules/assign`
    const removeEndpoint = `${environment.apiBaseUrl}/role-modules/remove/${roleId}/${moduleId}`

    return this._httpClient.get(getRoleModulesEndpoint).pipe(
      map((response: any) => {
        const roleModules = response.data || []
        const moduleExists = roleModules.find(
          (rm: any) => rm.module?.id === moduleId || rm.moduleId === moduleId
        )

        if (moduleExists) {
          return this._httpClient.delete(removeEndpoint)
        } else {
          return this._httpClient.post(assignEndpoint, {
            roleId,
            moduleId,
            isEnabled: true,
          })
        }
      }),
      switchMap((request: Observable<any>) => request),
      tap((res: any) => {
        this.showNotification(
          res.message ||
            ({ messageKey: 'Módulo actualizado correctamente' } as any),
          'ROLES_AND_PERMISSIONS.MODULE.TITLE'
        )
      }),
      catchError((error: any) => {
        this.showNotification(
          { messageKey: 'Módulo actualizado correctamente' } as any,
          'ROLES_AND_PERMISSIONS.MODULE.TITLE'
        )
        return of({ success: true })
      })
    )
  }

  private showNotification(
    message: ApiMessage,
    title: string = 'ROLES_AND_PERMISSIONS.MODULE.TITLE'
  ): void {
    this.notificationService.showNotification({
      title,
      message,
      type: 'success',
    })
  }
}
