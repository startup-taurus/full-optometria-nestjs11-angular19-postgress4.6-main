import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, Injector } from '@angular/core'
import { environment } from '@environment/environment'
import { ToastrNotificationService } from '../ui/notification.service'
import {
  ApiResponse,
  ApiData,
} from '@core/interfaces/api/api-response.interface'
import { map, Observable, tap, catchError } from 'rxjs'
import { ApiMessage } from '@core/interfaces/api/message.interface'
import {
  Shift,
  CreateShiftDto,
  UpdateShiftDto,
  QueryShiftDto,
} from '@core/interfaces/api/shift.interface'

@Injectable({
  providedIn: 'root',
})
export class ShiftsService {
  public API_URL = `${environment.apiBaseUrl}/shift-management/shifts`

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

  public createShift(shift: CreateShiftDto): Observable<ApiResponse<Shift>> {
    const endpoint = `${this.API_URL}/create`
    return this._httpClient
      .post<ApiResponse<Shift>>(endpoint, shift)
      .pipe(
        tap((res) =>
          this.showNotification(res.message, 'SHIFT_MANAGEMENT_MODULE.TITLE')
        )
      )
  }

  public findShifts(
    filter: QueryShiftDto
  ): Observable<ApiResponse<ApiData<Shift[]>>> {
    const endpoint = `${this.API_URL}/get-all`

    const convertedFilter: { [key: string]: string } = {}
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        convertedFilter[key] = String(value)
      }
    })

    const params = new HttpParams({ fromObject: convertedFilter })

    return this._httpClient
      .get<ApiResponse<ApiData<Shift[]>>>(endpoint, { params })
      .pipe(
        tap({
          next: (response) => {},
          error: () => {},
        })
      )
  }

  public getShiftById(id: string): Observable<ApiResponse<Shift>> {
    const endpoint = `${this.API_URL}/${id}`
    return this._httpClient.get<ApiResponse<Shift>>(endpoint)
  }

  public updateShift(
    id: string,
    shift: UpdateShiftDto
  ): Observable<ApiResponse<Shift>> {
    const endpoint = `${this.API_URL}/update/${id}`
    return this._httpClient
      .patch<ApiResponse<Shift>>(endpoint, shift)
      .pipe(
        tap((res) =>
          this.showNotification(res.message, 'SHIFT_MANAGEMENT_MODULE.TITLE')
        )
      )
  }

  public deleteShift(id: string): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/delete/${id}`
    return this._httpClient
      .delete<ApiResponse<any>>(endpoint)
      .pipe(
        tap((res) =>
          this.showNotification(res.message, 'SHIFT_MANAGEMENT_MODULE.TITLE')
        )
      )
  }

  private showNotification(
    message: ApiMessage,
    title: string = 'SHIFT_MANAGEMENT_MODULE.TITLE'
  ): void {
    this._notificationService.showNotification({
      title,
      message,
      type: 'success',
    })
  }
}
