import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { environment } from '../../../../environments/environment'
import {
  PublicProduct,
  PublicProductFilters,
  PublicProductQuery,
  PublicProductResponse,
} from '@core/interfaces/api/public-product.interface'

@Injectable({
  providedIn: 'root',
})
export class PublicCatalogService {
  private readonly http = inject(HttpClient)
  private readonly apiUrl = `${environment.apiBaseUrl}/products`

  private readonly publicHeaders = new HttpHeaders().set('skip', 'true')

  getProducts(query: PublicProductQuery): Observable<PublicProductResponse> {
    let params = new HttpParams()

    if (query.companyName) params = params.set('companyName', query.companyName)
    if (query.search) params = params.set('search', query.search)
    if (query.brand) params = params.set('brand', query.brand)
    if (query.categoryId) params = params.set('categoryId', query.categoryId)
    if (query.categoryIds?.length) {
      params = params.set('categoryIds', query.categoryIds.join(','))
    }
    if (query.subcategoryId)
      params = params.set('subcategoryId', query.subcategoryId)
    if (query.inStock !== undefined) {
      params = params.set('inStock', String(query.inStock))
    }
    if (query.minPrice !== undefined)
      params = params.set('minPrice', query.minPrice.toString())
    if (query.maxPrice !== undefined)
      params = params.set('maxPrice', query.maxPrice.toString())
    if (query.sortBy) params = params.set('sortBy', query.sortBy)
    if (query.branchId) params = params.set('branchId', query.branchId)
    if (query.page) params = params.set('page', query.page.toString())
    if (query.limit) params = params.set('limit', query.limit.toString())

    return this.http
      .get<any>(`${this.apiUrl}/public/catalog`, {
        params,
        headers: this.publicHeaders,
      })
      .pipe(map((response) => response.data.data))
  }

  getProductById(id: string): Observable<PublicProduct> {
    return this.http
      .get<any>(`${this.apiUrl}/public/${id}`, {
        headers: this.publicHeaders,
      })
      .pipe(map((response) => response.data.data))
  }

  getFilters(companyName?: string): Observable<PublicProductFilters> {
    let params = new HttpParams()
    if (companyName) params = params.set('companyName', companyName)

    return this.http
      .get<any>(`${this.apiUrl}/public/filters`, {
        params,
        headers: this.publicHeaders,
      })
      .pipe(map((response) => response.data.data))
  }

  validateCompany(
    companyName: string
  ): Observable<{ isValid: boolean; company: any }> {
    return this.http
      .get<any>(`${this.apiUrl}/public/validate-company/${companyName}`, {
        headers: this.publicHeaders,
      })
      .pipe(map((response) => response.data.data))
  }

  getAllowedCompanies(): Observable<string[]> {
    return this.http
      .get<any>(`${this.apiUrl}/public/allowed-companies`, {
        headers: this.publicHeaders,
      })
      .pipe(map((response) => response.data.data))
  }

  generateWhatsAppLink(product: PublicProduct): string {
    if (!product.createdByUser?.mobilePhone) {
      return ''
    }

    let cleanPhone = product.createdByUser.mobilePhone.replace(/\D/g, '')

    if (!cleanPhone.startsWith('593') && cleanPhone.length <= 10) {
      cleanPhone = '593' + cleanPhone
    }

    const message = `Hola, me interesa el producto *${product.name}*. ¿Podrías darme más información?`
    const encodedMessage = encodeURIComponent(message)

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
  }

  getImageUrl(path: string): string {
    if (!path) return 'assets/images/products/p-1.png'
    return `${environment.fileBaseUrl}/${path}`
  }
}
