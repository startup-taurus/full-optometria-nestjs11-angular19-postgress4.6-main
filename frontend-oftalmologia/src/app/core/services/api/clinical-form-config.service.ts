import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { BranchAwareService } from './branch-aware.service'
import { BranchService } from './branch.service'
import {
  ClinicalFormConfig,
  CreateClinicalFormConfigDto,
  UpdateClinicalFormConfigDto,
  FieldsConfig,
} from '../../interfaces/api/clinical-form-config.interface'
import { ApiResponse } from '../../interfaces/api/api-response.interface'

@Injectable({
  providedIn: 'root',
})
export class ClinicalFormConfigService extends BranchAwareService<ClinicalFormConfig> {
  constructor(
    protected override http: HttpClient,
    protected override branchService: BranchService
  ) {
    super(http, branchService, 'clinical-form-config')
  }

  getConfig(): Observable<ClinicalFormConfig | null> {
    return this.http
      .get<ApiResponse<ClinicalFormConfig>>(`${this.baseUrl}/config`)
      .pipe(map((response) => response.data || null))
  }

  initializeConfig(): Observable<ClinicalFormConfig> {
    return this.http
      .post<ApiResponse<ClinicalFormConfig>>(`${this.baseUrl}/initialize`, {})
      .pipe(map((response) => response.data!))
  }

  override getById(id: string): Observable<ClinicalFormConfig | null> {
    return this.http
      .get<ApiResponse<ClinicalFormConfig>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data || null))
  }

  override create(
    dto: CreateClinicalFormConfigDto
  ): Observable<ClinicalFormConfig> {
    return this.http
      .post<ApiResponse<ClinicalFormConfig>>(`${this.baseUrl}/create`, dto)
      .pipe(map((response) => response.data!))
  }

  override update(
    id: string,
    dto: UpdateClinicalFormConfigDto
  ): Observable<ClinicalFormConfig> {
    return this.http
      .patch<
        ApiResponse<ClinicalFormConfig>
      >(`${this.baseUrl}/update/${id}`, dto)
      .pipe(map((response) => response.data!))
  }

  upsert(dto: CreateClinicalFormConfigDto): Observable<ClinicalFormConfig> {
    return this.http
      .post<ApiResponse<ClinicalFormConfig>>(`${this.baseUrl}/upsert`, dto)
      .pipe(map((response) => response.data!))
  }

  createOrUpdate(
    dto: CreateClinicalFormConfigDto
  ): Observable<ClinicalFormConfig> {
    return this.upsert(dto)
  }

  override delete(id: string): Observable<any> {
    return this.http
      .delete<ApiResponse<any>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data!))
  }
}
