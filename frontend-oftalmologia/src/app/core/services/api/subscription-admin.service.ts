import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { environment } from '@environment/environment'
import {
  ApiData,
  ApiResponse,
} from '@core/interfaces/api/api-response.interface'
import {
  AdminSubscriptionRow,
  ListSubscriptionsQuery,
  ManageSubscriptionPayload,
  Plan,
} from '@core/interfaces/api/subscription.interface'

@Injectable({
  providedIn: 'root',
})
export class SubscriptionAdminService {
  private readonly API_URL = `${environment.apiBaseUrl}/subscriptions/admin`
  private readonly COMPANIES_URL = `${environment.apiBaseUrl}/companies`

  constructor(private readonly http: HttpClient) {}

  list(
    query: ListSubscriptionsQuery
  ): Observable<ApiResponse<ApiData<AdminSubscriptionRow[]>>> {
    let params = new HttpParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString())
      }
    })
    return this.http.get<ApiResponse<ApiData<AdminSubscriptionRow[]>>>(
      this.API_URL,
      { params }
    )
  }

  getPlans(): Observable<ApiResponse<ApiData<Plan[]>>> {
    return this.http.get<ApiResponse<ApiData<Plan[]>>>(`${this.API_URL}/plans`)
  }

  manage(
    companyId: string,
    payload: ManageSubscriptionPayload
  ): Observable<ApiResponse<AdminSubscriptionRow>> {
    return this.http.patch<ApiResponse<AdminSubscriptionRow>>(
      `${this.API_URL}/${companyId}`,
      payload
    )
  }

  cancel(companyId: string): Observable<ApiResponse<AdminSubscriptionRow>> {
    return this.http.post<ApiResponse<AdminSubscriptionRow>>(
      `${this.API_URL}/${companyId}/cancel`,
      {}
    )
  }

  reactivate(
    companyId: string,
    currentPeriodEnd?: string
  ): Observable<ApiResponse<AdminSubscriptionRow>> {
    return this.http.post<ApiResponse<AdminSubscriptionRow>>(
      `${this.API_URL}/${companyId}/reactivate`,
      currentPeriodEnd ? { currentPeriodEnd } : {}
    )
  }

  // Activa/desactiva la empresa (bloquea/permite el login de sus usuarios).
  setCompanyActive(
    companyId: string,
    isActive: boolean
  ): Observable<ApiResponse<AdminSubscriptionRow>> {
    return this.http.post<ApiResponse<AdminSubscriptionRow>>(
      `${this.API_URL}/${companyId}/company-active`,
      { isActive }
    )
  }

  // Borrado en CASCADA (superadmin): elimina la empresa y TODOS sus datos.
  deleteCompanyCascade(
    companyId: string
  ): Observable<ApiResponse<{ id: string }>> {
    return this.http.delete<ApiResponse<{ id: string }>>(
      `${this.COMPANIES_URL}/${companyId}/cascade`
    )
  }
}
