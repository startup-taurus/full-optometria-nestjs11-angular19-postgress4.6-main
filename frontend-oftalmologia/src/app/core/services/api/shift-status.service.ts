import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { environment } from '@environment/environment'
import { ApiResponse } from '@core/interfaces/api/api-response.interface'
import { Observable } from 'rxjs'
import { ShiftStatus } from '@core/interfaces/api/shift.interface'

@Injectable({
  providedIn: 'root',
})
export class ShiftStatusService {
  public API_URL = `${environment.apiBaseUrl}/shift-management/shift-status`

  constructor(private _httpClient: HttpClient) {}

  public findAllStatuses(): Observable<ApiResponse<ShiftStatus[]>> {
    const endpoint = `${this.API_URL}/get-all`
    return this._httpClient.get<ApiResponse<ShiftStatus[]>>(endpoint)
  }

  public getStatusById(id: string): Observable<ApiResponse<ShiftStatus>> {
    const endpoint = `${this.API_URL}/${id}`
    return this._httpClient.get<ApiResponse<ShiftStatus>>(endpoint)
  }
}
