import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, Injector } from '@angular/core'
import { environment } from '@environment/environment'
import { ToastrNotificationService } from '../ui/notification.service'
import {
  ApiData,
  ApiResponse,
} from '@core/interfaces/api/api-response.interface'
import { map, Observable, tap, catchError } from 'rxjs'
import { ApiMessage } from '@core/interfaces/api/message.interface'
import { Product } from '@core/interfaces/api/inventory.interface'

export interface TransferStockPayload {
  destinationBranchId: string
  quantity: number
  note?: string
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  public API_URL = `${environment.apiBaseUrl}/products`

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

  public createProduct(product: object): Observable<ApiResponse<Product>> {
    const endpoint = `${this.API_URL}/create`
    return this._httpClient.post<ApiResponse<Product>>(endpoint, product)
  }

  public findProducts(
    filter: object
  ): Observable<ApiResponse<ApiData<Product[]>>> {
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
      .get<ApiResponse<ApiData<Product[]>>>(endpoint, {
        params,
      })
      .pipe(
        tap({
          next: (response) => {},
          error: () => {},
        })
      )
  }

  public updateProduct(
    id: string,
    product: object
  ): Observable<ApiResponse<Product>> {
    const endpoint = `${this.API_URL}/update/${id}`
    return this._httpClient
      .patch<ApiResponse<Product>>(endpoint, product)
      .pipe(tap((res) => this.showNotification(res.message, 'INVENTORY.TITLE')))
  }

  public getProductById(id: string): Observable<Product> {
    const endpoint = `${this.API_URL}/${id}`

    return this._httpClient.get<any>(endpoint).pipe(
      map((response) => {
        const product = response?.data?.data?.data || response?.data?.data || response?.data
        return product as Product
      })
    )
  }

  public findProductByCode(code: string): Observable<Product> {
    const normalizedCode = (code || '').trim()
    const endpoint = `${this.API_URL}/by-code/${encodeURIComponent(normalizedCode)}`

    return this._httpClient.get<any>(endpoint).pipe(
      map((response) => {
        const product = response?.data?.data?.data || response?.data?.data || response?.data
        return product as Product
      })
    )
  }

  public deleteProduct(id: string): Observable<ApiResponse<Product>> {
    const endpoint = `${this.API_URL}/delete/${id}`
    return this._httpClient
      .delete<ApiResponse<Product>>(endpoint)
      .pipe(tap((res) => this.showNotification(res.message, 'INVENTORY.TITLE')))
  }

  public uploadProductImage(
    productId: string,
    file: File,
    isCover: boolean = true
  ): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/${productId}/upload-image`
    const formData = new FormData()
    formData.append('image', file)
    formData.append('isCover', String(isCover))

    return this._httpClient
      .post<ApiResponse<any>>(endpoint, formData)
      .pipe(tap((res) => this.showNotification(res.message, 'INVENTORY.TITLE')))
  }

  public getProductImages(productId: string): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/${productId}/images`
    return this._httpClient.get<ApiResponse<any>>(endpoint)
  }

  public deleteProductImage(
    productId: string,
    imageId: string
  ): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/${productId}/images/${imageId}`
    return this._httpClient
      .delete<ApiResponse<any>>(endpoint)
      .pipe(tap((res) => this.showNotification(res.message, 'INVENTORY.TITLE')))
  }

  public getImageUrl(imagePath?: string): string {
    if (!imagePath) {
      return 'assets/images/lentes.png'
    }
    return `${environment.fileBaseUrl}/${imagePath}`
  }

  public transferStock(
    productId: string,
    payload: TransferStockPayload
  ): Observable<ApiResponse<any>> {
    const endpoint = `${this.API_URL}/${productId}/transfer-stock`
    return this._httpClient
      .post<ApiResponse<any>>(endpoint, payload)
      .pipe(tap((res) => this.showNotification(res.message, 'INVENTORY.TITLE')))
  }

  public getTransferHistory(params?: {
    direction?: 'sent' | 'received' | 'all'
    productId?: string
  }): Observable<ApiResponse<any[]>> {
    const endpoint = `${this.API_URL}/transfers/history`
    let httpParams = new HttpParams()

    if (params?.direction) {
      httpParams = httpParams.set('direction', params.direction)
    }
    if (params?.productId) {
      httpParams = httpParams.set('productId', params.productId)
    }

    return this._httpClient.get<ApiResponse<any[]>>(endpoint, {
      params: httpParams,
    })
  }

  public getStockHistory(params?: {
    productId?: string
  }): Observable<ApiResponse<any[]>> {
    const endpoint = `${this.API_URL}/stock/history`
    let httpParams = new HttpParams()

    if (params?.productId) {
      httpParams = httpParams.set('productId', params.productId)
    }

    return this._httpClient.get<ApiResponse<any[]>>(endpoint, {
      params: httpParams,
    })
  }

  public getProductHistory(params?: {
    productId?: string
  }): Observable<ApiResponse<any[]>> {
    const endpoint = `${this.API_URL}/audit/history`
    let httpParams = new HttpParams()

    if (params?.productId) {
      httpParams = httpParams.set('productId', params.productId)
    }

    return this._httpClient.get<ApiResponse<any[]>>(endpoint, {
      params: httpParams,
    })
  }

  private showNotification(
    message: ApiMessage,
    title: string = 'INVENTORY.TITLE'
  ): void {
    this._notificationService.showNotification({
      title,
      message,
      type: 'success',
    })
  }
}
