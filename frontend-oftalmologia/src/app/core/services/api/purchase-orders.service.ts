import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BranchAwareService } from './branch-aware.service';
import { BranchService } from './branch.service';
import {
  PurchaseOrder,
  UpdatePurchaseOrderDto,
  PurchaseOrderQueryParams,
} from '../../interfaces/api/purchase-order.interface';
import { ApiResponse, ApiData } from '../../interfaces/api/api-response.interface';

@Injectable({
  providedIn: 'root',
})
export class PurchaseOrdersService extends BranchAwareService<PurchaseOrder> {
  constructor(
    protected override http: HttpClient,
    protected override branchService: BranchService,
  ) {
    super(http, branchService, 'purchase-orders');
  }

  override getAll(queryParams?: PurchaseOrderQueryParams): Observable<PurchaseOrder[]> {
    let params = new HttpParams();

    params = params.set('page', String(queryParams?.page || 1));
    params = params.set('limit', String(queryParams?.limit || 1000));

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== '' &&
          key !== 'page' &&
          key !== 'limit'
        ) {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http
      .get<ApiResponse<ApiData<PurchaseOrder[]>>>(`${this.baseUrl}`, { params })
      .pipe(map((response) => response.data?.result || []));
  }

  getPaginated(queryParams?: PurchaseOrderQueryParams): Observable<{
    data: PurchaseOrder[];
    total: number;
    page: number;
    limit: number;
  }> {
    let params = new HttpParams();

    params = params.set('page', String(queryParams?.page || 1));
    params = params.set('limit', String(queryParams?.limit || 10));

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== '' &&
          key !== 'page' &&
          key !== 'limit'
        ) {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http
      .get<ApiResponse<ApiData<PurchaseOrder[]>>>(`${this.baseUrl}`, { params })
      .pipe(
        map((response) => ({
          data: response.data?.result || [],
          total: response.data?.totalCount || 0,
          page: response.data?.currentPage || 1,
          limit: queryParams?.limit || 10,
        })),
      );
  }

  override getById(id: string): Observable<PurchaseOrder | null> {
    return this.http
      .get<ApiResponse<PurchaseOrder>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data || null));
  }

  override update(id: string, dto: UpdatePurchaseOrderDto): Observable<PurchaseOrder> {
    return this.http
      .patch<ApiResponse<PurchaseOrder>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map((response) => response.data!));
  }

  remove(id: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`);
  }
}
