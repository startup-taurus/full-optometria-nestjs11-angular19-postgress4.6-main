import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, Injector } from '@angular/core'
import { environment } from '@environment/environment'
import { ToastrNotificationService } from '../ui/notification.service'
import {
  ApiData,
  ApiResponse,
} from '@core/interfaces/api/api-response.interface'
import { map, Observable, tap, catchError } from 'rxjs'
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  QuerySupplierRequest,
} from '@core/interfaces/api/supplier.interface'

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  public API_URL = `${environment.apiBaseUrl}/suppliers`

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

  public createSupplier(
    supplier: CreateSupplierRequest
  ): Observable<ApiResponse<Supplier>> {
    const endpoint = `${this.API_URL}/create`
    return this._httpClient
      .post<ApiResponse<Supplier>>(endpoint, supplier)
      .pipe(
        tap((res) => {
          this.showNotification(res.message, 'SUPPLIERS.CREATE_SUCCESS')
        }),
        catchError((error) => {
          throw error
        })
      )
  }

  public findSuppliers(
    filter: QuerySupplierRequest
  ): Observable<ApiResponse<ApiData<Supplier[]>>> {
    const endpoint = `${this.API_URL}/get-all`

    const convertedFilter: { [key: string]: string } = {}
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'isActive') {
          convertedFilter[key] =
            value === true || value === 'true' ? 'true' : 'false'
        } else {
          convertedFilter[key] = String(value)
        }
      }
    })

    const params = new HttpParams({ fromObject: convertedFilter })

    return this._httpClient
      .get<ApiResponse<ApiData<Supplier[]>>>(endpoint, {
        params,
      })
      .pipe(
        tap({
          next: (response) => {},
          error: (error) => {
          },
        })
      )
  }

  public getSupplierById(id: string): Observable<ApiResponse<Supplier>> {
    const endpoint = `${this.API_URL}/${id}`
    return this._httpClient.get<ApiResponse<Supplier>>(endpoint).pipe(
      catchError((error) => {
        throw error
      })
    )
  }

  public updateSupplier(
    id: string,
    supplier: UpdateSupplierRequest
  ): Observable<ApiResponse<Supplier>> {
    const endpoint = `${this.API_URL}/update/${id}`
    return this._httpClient
      .patch<ApiResponse<Supplier>>(endpoint, supplier)
      .pipe(
        tap((res) => {
          this.showNotification(res.message, 'SUPPLIERS.UPDATE_SUCCESS')
        }),
        catchError((error) => {
          throw error
        })
      )
  }

  public deleteSupplier(id: string): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/delete/${id}`
    return this._httpClient.delete<ApiResponse<any>>(endpoint).pipe(
      tap((res) => {
        this.showNotification(res.message, 'SUPPLIERS.DELETE_SUCCESS')
      }),
      catchError((error) => {
        throw error
      })
    )
  }

  private showNotification(message: any, title: string): void {
    this.notificationService.showNotification({
      type: 'success',
      message: message,
      title: title,
    })
  }
}
