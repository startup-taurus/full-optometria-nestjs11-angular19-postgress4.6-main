import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { environment } from '@environment/environment'
import { ApiResponse } from '@core/interfaces/api/api-response.interface'
import { CompanySubscription } from '@core/interfaces/api/subscription.interface'
import { Company } from '@core/interfaces/api/company.interface'

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private readonly API_URL = `${environment.apiBaseUrl}/subscriptions`

  constructor(private readonly http: HttpClient) {}

  getMySubscription(): Observable<ApiResponse<CompanySubscription | null>> {
    return this.http.get<ApiResponse<CompanySubscription | null>>(
      `${this.API_URL}/me`
    )
  }

  uploadCompanyLogo(file: File): Observable<ApiResponse<Company>> {
    const formData = new FormData()
    formData.append('file', file)
    return this.http.patch<ApiResponse<Company>>(
      `${this.API_URL}/company-logo`,
      formData
    )
  }

  cancelMySubscription(): Observable<
    ApiResponse<CompanySubscription & { billingNotified?: boolean | null }>
  > {
    return this.http.post<
      ApiResponse<CompanySubscription & { billingNotified?: boolean | null }>
    >(`${this.API_URL}/me/cancel`, {})
  }
}
