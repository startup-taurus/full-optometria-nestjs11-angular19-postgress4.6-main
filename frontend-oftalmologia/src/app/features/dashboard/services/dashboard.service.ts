import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { environment } from '@/environments/environment'
import {
  ChartDataResponse,
  ProductsInventoryResponse,
  TopProductsSoldResponse,
  PurchaseOrdersSummaryResponse,
  ApiResponse,
} from '../models/dashboard.model'

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient)
  private readonly apiUrl = `${environment.apiBaseUrl}/dashboard`

  getAppointmentsTrend(months: number = 3): Observable<ChartDataResponse> {
    return this.http
      .get<
        ApiResponse<ChartDataResponse>
      >(`${this.apiUrl}/appointments-trend?months=${months}`)
      .pipe(
        map((response) => {
          return response.data
        })
      )
  }

  getDiagnosisFrequency(): Observable<ChartDataResponse> {
    return this.http
      .get<ApiResponse<ChartDataResponse>>(`${this.apiUrl}/diagnosis-frequency`)
      .pipe(
        map((response) => {
          return response.data
        })
      )
  }

  getLaboratoryOrdersStatus(): Observable<ChartDataResponse> {
    return this.http
      .get<
        ApiResponse<ChartDataResponse>
      >(`${this.apiUrl}/laboratory-orders-status`)
      .pipe(
        map((response) => {
          return response.data
        })
      )
  }

  getProductsInventory(): Observable<ProductsInventoryResponse> {
    return this.http
      .get<
        ApiResponse<ProductsInventoryResponse>
      >(`${this.apiUrl}/products-inventory`)
      .pipe(
        map((response) => {
          return response.data
        })
      )
  }

  getShiftStatusDistribution(): Observable<ChartDataResponse> {
    return this.http
      .get<
        ApiResponse<ChartDataResponse>
      >(`${this.apiUrl}/shift-status-distribution`)
      .pipe(
        map((response) => {
          return response.data
        })
      )
  }

  getTopProductsSold(months: number = 1): Observable<TopProductsSoldResponse> {
    return this.http
      .get<
        ApiResponse<TopProductsSoldResponse>
      >(`${this.apiUrl}/top-products-sold?months=${months}`)
      .pipe(
        map((response) => {
          return response.data
        })
      )
  }

  getPatientsAgeDemographics(): Observable<ChartDataResponse> {
    return this.http
      .get<
        ApiResponse<ChartDataResponse>
      >(`${this.apiUrl}/patients-age-demographics`)
      .pipe(
        map((response) => {
          return response.data
        })
      )
  }

  getPurchaseOrdersSummary(): Observable<PurchaseOrdersSummaryResponse> {
    return this.http
      .get<ApiResponse<PurchaseOrdersSummaryResponse>>(`${this.apiUrl}/purchase-orders-summary`)
      .pipe(
        map((response) => {
          return response.data
        })
      )
  }
}
