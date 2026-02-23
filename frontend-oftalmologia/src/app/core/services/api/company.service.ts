import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, Injector } from '@angular/core'
import { environment } from '@environment/environment'
import { ToastrNotificationService } from '../ui/notification.service'
import {
  ApiData,
  ApiResponse,
} from '@core/interfaces/api/api-response.interface'
import { Observable, tap } from 'rxjs'
import {
  Company,
  CreateCompanyCompleteDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  QueryCompanyDto,
  CompanyCompleteResponse,
} from '@core/interfaces/api/company.interface'

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private API_URL = `${environment.apiBaseUrl}/companies`
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

  public createCompany(
    company: CreateCompanyDto
  ): Observable<ApiResponse<Company>> {
    return this._httpClient
      .post<ApiResponse<Company>>(this.API_URL, company)
      .pipe(
        tap((res) =>
          this.notificationService.showNotification({
            title: 'COMPANIES_MODULE.TITLE',
            message: res.message,
            type: 'success',
          })
        )
      )
  }

  public createCompanyComplete(
    data: CreateCompanyCompleteDto
  ): Observable<ApiResponse<CompanyCompleteResponse>> {
    const endpoint = `${this.API_URL}/complete`
    return this._httpClient
      .post<ApiResponse<CompanyCompleteResponse>>(endpoint, data)
      .pipe(
        tap((res) =>
          this.notificationService.showNotification({
            title: 'COMPANIES_MODULE.TITLE',
            message: res.message,
            type: 'success',
          })
        )
      )
  }

  public getAllCompanies(
    queryDto?: QueryCompanyDto
  ): Observable<ApiResponse<ApiData<Company[]>>> {
    let params = new HttpParams()

    if (queryDto) {
      Object.keys(queryDto).forEach((key) => {
        const value = queryDto[key as keyof QueryCompanyDto]
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString())
        }
      })
    }

    return this._httpClient.get<ApiResponse<ApiData<Company[]>>>(this.API_URL, {
      params,
    })
  }

  public getCompanyById(id: string): Observable<ApiResponse<Company>> {
    const endpoint = `${this.API_URL}/${id}`
    return this._httpClient.get<ApiResponse<Company>>(endpoint)
  }

  public updateCompany(
    id: string,
    company: UpdateCompanyDto
  ): Observable<ApiResponse<Company>> {
    const endpoint = `${this.API_URL}/${id}`
    return this._httpClient.patch<ApiResponse<Company>>(endpoint, company).pipe(
      tap((res) =>
        this.notificationService.showNotification({
          title: 'COMPANIES_MODULE.TITLE',
          message: res.message,
          type: 'success',
        })
      )
    )
  }

  public deleteCompany(id: string): Observable<ApiResponse<{ id: string }>> {
    const endpoint = `${this.API_URL}/${id}`
    return this._httpClient.delete<ApiResponse<{ id: string }>>(endpoint).pipe(
      tap((res) =>
        this.notificationService.showNotification({
          title: 'COMPANIES_MODULE.TITLE',
          message: res.message,
          type: 'success',
        })
      )
    )
  }

  public getActiveCompanies(): Observable<ApiResponse<Company[]>> {
    const endpoint = `${this.API_URL}/selector/active`
    return this._httpClient.get<ApiResponse<Company[]>>(endpoint)
  }
}
