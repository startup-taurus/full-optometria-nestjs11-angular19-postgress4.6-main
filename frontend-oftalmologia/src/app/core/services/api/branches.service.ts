import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, Injector } from '@angular/core'
import { environment } from '@environment/environment'
import { ToastrNotificationService } from '../ui/notification.service'
import {
  ApiResponse,
  ApiData,
} from '@core/interfaces/api/api-response.interface'
import { map, Observable, tap } from 'rxjs'
import { ApiMessage } from '@core/interfaces/api/message.interface'
import {
  Branch,
  CreateBranchDto,
  UpdateBranchDto,
  QueryBranchDto,
} from '@core/interfaces/api/branch.interface'

@Injectable({
  providedIn: 'root',
})
export class BranchesService {
  public API_URL = `${environment.apiBaseUrl}/branches`

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

  public createBranch(
    branch: CreateBranchDto
  ): Observable<ApiResponse<Branch>> {
    const endpoint = `${this.API_URL}/create`
    return this._httpClient
      .post<ApiResponse<Branch>>(endpoint, branch)
      .pipe(
        tap((res) =>
          this.showNotification(res.message, 'BRANCHES_MODULE.TITLE')
        )
      )
  }

  public findBranches(
    filter: QueryBranchDto
  ): Observable<ApiResponse<ApiData<Branch[]>>> {
    const endpoint = `${this.API_URL}/get-all`

    const convertedFilter: { [key: string]: string } = {}
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        convertedFilter[key] = String(value)
      }
    })

    const params = new HttpParams({ fromObject: convertedFilter })

    return this._httpClient.get<any>(endpoint, { params }).pipe(
      map((response) => {
      
        if (response.data && response.data.data) {
          return {
            ...response,
            data: response.data.data,
          }
        }
        return response
      }),
      tap({
        next: (response) => {
        },
        error: (error) => {
        },
      })
    )
  }

  public getBranchById(id: string): Observable<ApiResponse<Branch>> {
    const endpoint = `${this.API_URL}/${id}`
    return this._httpClient.get<ApiResponse<Branch>>(endpoint)
  }

  public updateBranch(
    id: string,
    branch: UpdateBranchDto
  ): Observable<ApiResponse<Branch>> {
    const endpoint = `${this.API_URL}/update/${id}`
    return this._httpClient
      .patch<ApiResponse<Branch>>(endpoint, branch)
      .pipe(
        tap((res) =>
          this.showNotification(res.message, 'BRANCHES_MODULE.TITLE')
        )
      )
  }

  public deleteBranch(id: string): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/delete/${id}`
    return this._httpClient
      .delete<ApiResponse<any>>(endpoint)
      .pipe(
        tap((res) =>
          this.showNotification(res.message, 'BRANCHES_MODULE.TITLE')
        )
      )
  }

  private showNotification(
    message: ApiMessage,
    title: string = 'BRANCHES_MODULE.TITLE'
  ): void {
    this._notificationService.showNotification({
      title,
      message,
      type: 'success',
    })
  }
}
