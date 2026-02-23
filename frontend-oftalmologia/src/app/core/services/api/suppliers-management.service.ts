import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import {
  Observable,
  forkJoin,
  map,
  filter,
  catchError,
  of,
  tap,
  startWith,
  retry,
  timeout,
} from 'rxjs'
import { SupplierService } from './supplier.service'
import { Supplier } from '@core/interfaces/api/supplier.interface'
import {
  ApiResponse,
  ApiData,
} from '@core/interfaces/api/api-response.interface'
import { environment } from '@environment/environment'

//no olvidar moverla a las interfaces
export interface SupplierFilter {
  search?: string
  name?: string
  documentNumber?: string
  email?: string
  phone?: string
  isActive?: boolean
  page?: number
  limit?: number
}

@Injectable({
  providedIn: 'root',
})
export class SuppliersManagementService {
  private readonly suppliersUrl = `${environment.apiBaseUrl}/suppliers`

  constructor(
    private http: HttpClient,
    private supplierService: SupplierService
  ) {}

  private extractSuppliersData(response: any): Supplier[] {
    const result = response?.data?.data?.result || []

    if (result.length > 0) {
    }

    return result
  }

  getSuppliers(filter: SupplierFilter = {}): Observable<Supplier[]> {
    const params = this.buildParams(filter)

    return this.http
      .get<any>(`${this.suppliersUrl}/get-all`, {
        params: params,
      })
      .pipe(
        timeout(30000),
        retry(1),
        tap((response) =>
          console.log('[SuppliersService] Suppliers HTTP response:', response)
        ),
        map((response) => this.extractSuppliersData(response)),
        tap((suppliers) =>
          console.log('[SuppliersService] Final suppliers:', suppliers)
        ),
        catchError((error) => {
          return of([])
        })
      )
  }

  createSupplier(supplierData: any): Observable<Supplier> {
    return this.supplierService.createSupplier(supplierData).pipe(
      map((response) => response?.data || null),
      filter((result): result is Supplier => result !== null),
      catchError((error) => {
        throw error
      })
    )
  }

  updateSupplier(id: string, supplierData: any): Observable<Supplier> {
    return this.supplierService.updateSupplier(id, supplierData).pipe(
      map((response) => response?.data || null),
      filter((result): result is Supplier => result !== null),
      catchError((error) => {
        throw error
      })
    )
  }

  deleteSupplier(id: string): Observable<void> {
    return this.supplierService.deleteSupplier(id).pipe(
      map(() => void 0),
      catchError((error) => {
        throw error
      })
    )
  }

  getSupplierById(id: string): Observable<Supplier> {
    return this.supplierService.getSupplierById(id).pipe(
      map((response) => response?.data || null),
      filter((result): result is Supplier => result !== null),
      catchError((error) => {
        throw error
      })
    )
  }

  private buildParams(filter: SupplierFilter): { [key: string]: string } {
    const params: { [key: string]: string } = {}

    if (filter.search) params['search'] = filter.search
    if (filter.name) params['name'] = filter.name
    if (filter.documentNumber) params['documentNumber'] = filter.documentNumber
    if (filter.email) params['email'] = filter.email
    if (filter.phone) params['phone'] = filter.phone
    if (filter.isActive !== undefined)
      params['isActive'] = filter.isActive.toString()
    if (filter.page) params['page'] = filter.page.toString()
    if (filter.limit) params['limit'] = filter.limit.toString()

    return params
  }
}
