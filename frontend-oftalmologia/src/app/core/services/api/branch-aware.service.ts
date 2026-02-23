import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, switchMap, map } from 'rxjs'
import { environment } from '@environment/environment'
import { ApiResponse } from '@core/interfaces/api/api-response.interface'
import { BranchService } from './branch.service'
import { PaginatedResponse } from '@core/interfaces/api/inventory.interface'

@Injectable()
export abstract class BranchAwareService<T> {
  protected baseUrl: string

  constructor(
    protected http: HttpClient,
    protected branchService: BranchService,
    protected moduleName: string
  ) {
    this.baseUrl = environment.apiBaseUrl + '/' + moduleName
  }

  getAll(params?: any): Observable<T[]> {
    const queryParams = {
      limit: '1000',
      ...params,
    }

    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/get-all`, { params: queryParams })
      .pipe(map((response) => response.data?.data?.result || []))
  }

  getById(id: string): Observable<T | null> {
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data || null))
  }

  create(data: Partial<T>): Observable<T | null> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}`, data)
      .pipe(map((response) => response.data || null))
  }

  update(id: string, data: Partial<T>): Observable<T | null> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}/${id}`, data)
      .pipe(map((response) => response.data || null))
  }

  delete(id: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => true))
  }

  getAllReactive(): Observable<T[]> {
    return this.branchService
      .getBranchFilterState()
      .pipe(switchMap(() => this.getAll()))
  }
}
