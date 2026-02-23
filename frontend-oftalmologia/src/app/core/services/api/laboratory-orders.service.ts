import { Injectable } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { BranchAwareService } from './branch-aware.service'
import { BranchService } from './branch.service'
import {
  LaboratoryOrder,
  CreateLaboratoryOrderDto,
  UpdateLaboratoryOrderDto,
  LaboratoryOrderQueryParams,
  ChangeStatusDto,
  PreloadedOrderData,
} from '../../interfaces/api/laboratory-order.interface'
import {
  ApiResponse,
  ApiData,
} from '../../interfaces/api/api-response.interface'

@Injectable({
  providedIn: 'root',
})
export class LaboratoryOrdersService extends BranchAwareService<LaboratoryOrder> {
  constructor(
    protected override http: HttpClient,
    protected override branchService: BranchService
  ) {
    super(http, branchService, 'laboratory-orders')
  }

  getAllWithFilters(queryParams?: LaboratoryOrderQueryParams): Observable<{
    data: LaboratoryOrder[]
    total: number
    page: number
    limit: number
  }> {
    let params = new HttpParams()

    params = params.set('page', String(queryParams?.page || 1))
    params = params.set('limit', String(queryParams?.limit || 10))

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== '' &&
          key !== 'page' &&
          key !== 'limit'
        ) {
          params = params.set(key, String(value))
        }
      })
    }

    return this.http
      .get<
        ApiResponse<ApiData<LaboratoryOrder[]>>
      >(`${this.baseUrl}/get-all`, { params })
      .pipe(
        map((response) => ({
          data: response.data?.result || [],
          total: response.data?.totalCount || 0,
          page: response.data?.currentPage || 1,
          limit: queryParams?.limit || 10,
        }))
      )
  }

  override getById(id: string): Observable<LaboratoryOrder | null> {
    return this.http
      .get<ApiResponse<LaboratoryOrder>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data || null))
  }

  getDataFromClinicalHistory(
    clinicalHistoryId: string
  ): Observable<PreloadedOrderData> {
    return this.http
      .get<
        ApiResponse<PreloadedOrderData>
      >(`${this.baseUrl}/from-clinical-history/${clinicalHistoryId}`)
      .pipe(map((response) => response.data!))
  }

  override create(dto: CreateLaboratoryOrderDto): Observable<LaboratoryOrder> {
    return this.http
      .post<ApiResponse<LaboratoryOrder>>(`${this.baseUrl}/create`, dto)
      .pipe(map((response) => response.data!))
  }

  override update(
    id: string,
    dto: UpdateLaboratoryOrderDto
  ): Observable<LaboratoryOrder> {
    return this.http
      .patch<ApiResponse<LaboratoryOrder>>(`${this.baseUrl}/update/${id}`, dto)
      .pipe(map((response) => response.data!))
  }

  changeStatus(id: string, isConfirmed: boolean): Observable<LaboratoryOrder> {
    const dto: ChangeStatusDto = { isConfirmed }
    return this.http
      .patch<
        ApiResponse<LaboratoryOrder>
      >(`${this.baseUrl}/change-status/${id}`, dto)
      .pipe(map((response) => response.data!))
  }

  override delete(id: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<any>>(`${this.baseUrl}/delete/${id}`)
      .pipe(map((response) => response.statusCode === 200))
  }
}
