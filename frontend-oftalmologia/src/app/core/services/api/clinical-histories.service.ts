import { Injectable } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { BranchAwareService } from './branch-aware.service'
import { BranchService } from './branch.service'
import {
  ClinicalHistory,
  CreateClinicalHistoryDto,
  UpdateClinicalHistoryDto,
  ClinicalHistoryQueryParams,
  ChangeStatusDto,
} from '../../interfaces/api/clinical-history.interface'
import {
  ApiResponse,
  ApiData,
} from '../../interfaces/api/api-response.interface'

@Injectable({
  providedIn: 'root',
})
export class ClinicalHistoriesService extends BranchAwareService<ClinicalHistory> {
  constructor(
    protected override http: HttpClient,
    protected override branchService: BranchService
  ) {
    super(http, branchService, 'clinical-histories')
  }

  getAllWithFilters(queryParams?: ClinicalHistoryQueryParams): Observable<{
    data: ClinicalHistory[]
    total: number
    page: number
    limit: number
  }> {
    let params = new HttpParams()

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value))
        }
      })
    }

    return this.http
      .get<
        ApiResponse<ApiData<ClinicalHistory[]>>
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

  override getById(id: string): Observable<ClinicalHistory | null> {
    return this.http
      .get<ApiResponse<ClinicalHistory>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data || null))
  }

  getByUser(userId: string): Observable<ClinicalHistory[]> {
    return this.http
      .get<ApiResponse<ClinicalHistory[]>>(`${this.baseUrl}/by-user/${userId}`)
      .pipe(map((response) => response.data || []))
  }

  override create(dto: CreateClinicalHistoryDto): Observable<ClinicalHistory> {
    return this.http
      .post<ApiResponse<ClinicalHistory>>(`${this.baseUrl}/create`, dto)
      .pipe(map((response) => response.data!))
  }

  override update(
    id: string,
    dto: UpdateClinicalHistoryDto
  ): Observable<ClinicalHistory> {
    return this.http
      .patch<ApiResponse<ClinicalHistory>>(`${this.baseUrl}/update/${id}`, dto)
      .pipe(map((response) => response.data!))
  }

  changeStatus(id: string, isSent: boolean): Observable<ClinicalHistory> {
    const dto: ChangeStatusDto = { isSent }
    return this.http
      .patch<
        ApiResponse<ClinicalHistory>
      >(`${this.baseUrl}/change-status/${id}`, dto)
      .pipe(map((response) => response.data!))
  }

  override delete(id: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<any>>(`${this.baseUrl}/delete/${id}`)
      .pipe(map((response) => response.statusCode === 200))
  }
}
