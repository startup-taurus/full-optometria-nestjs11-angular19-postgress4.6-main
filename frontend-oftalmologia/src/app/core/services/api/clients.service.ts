import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environment/environment';
import {
  Client,
  CreateClientDto,
  UpdateClientDto,
  ClientQueryParams,
} from '../../interfaces/api/client.interface';
import { ApiResponse, ApiData } from '../../interfaces/api/api-response.interface';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  constructor(private http: HttpClient) {}

  private readonly globalBaseUrl = `${environment.apiBaseUrl}/clients`;

  private getBaseUrl(patientId: string): string {
    return `${environment.apiBaseUrl}/patients/${patientId}/clients`;
  }

  private buildParams(queryParams?: ClientQueryParams): HttpParams {
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

    return params;
  }

  create(patientId: string, dto: CreateClientDto): Observable<Client> {
    return this.http
      .post<ApiResponse<Client>>(`${this.getBaseUrl(patientId)}`, dto)
      .pipe(map((response) => response.data!));
  }

  getAll(patientId: string, queryParams?: ClientQueryParams): Observable<{
    data: Client[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = this.buildParams(queryParams);

    return this.http
      .get<ApiResponse<ApiData<Client[]>>>(`${this.getBaseUrl(patientId)}`, { params })
      .pipe(
        map((response) => ({
          data: response.data?.result || [],
          total: response.data?.totalCount || 0,
          page: response.data?.currentPage || 1,
          limit: queryParams?.limit || 10,
        })),
      );
  }

  getById(patientId: string, clientId: string): Observable<Client | null> {
    return this.http
      .get<ApiResponse<Client>>(`${this.getBaseUrl(patientId)}/${clientId}`)
      .pipe(map((response) => response.data || null));
  }

  update(patientId: string, clientId: string, dto: UpdateClientDto): Observable<Client> {
    return this.http
      .patch<ApiResponse<Client>>(`${this.getBaseUrl(patientId)}/${clientId}`, dto)
      .pipe(map((response) => response.data!));
  }

  delete(patientId: string, clientId: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.getBaseUrl(patientId)}/${clientId}`);
  }

  searchByDocumentNumber(
    patientId: string,
    documentNumber: string,
  ): Observable<Client[]> {
    return this.http
      .get<ApiResponse<Client[]>>(
        `${this.getBaseUrl(patientId)}/search/${documentNumber}`,
      )
      .pipe(map((response) => response.data || []));
  }

  createGlobal(dto: CreateClientDto): Observable<Client> {
    return this.http
      .post<ApiResponse<Client>>(this.globalBaseUrl, dto)
      .pipe(map((response) => response.data!));
  }

  getAllGlobal(queryParams?: ClientQueryParams): Observable<{
    data: Client[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = this.buildParams(queryParams);

    return this.http
      .get<ApiResponse<ApiData<Client[]>>>(this.globalBaseUrl, { params })
      .pipe(
        map((response) => ({
          data: response.data?.result || [],
          total: response.data?.totalCount || 0,
          page: response.data?.currentPage || 1,
          limit: queryParams?.limit || 10,
        })),
      );
  }

  getByIdGlobal(clientId: string): Observable<Client | null> {
    return this.http
      .get<ApiResponse<Client>>(`${this.globalBaseUrl}/${clientId}`)
      .pipe(map((response) => response.data || null));
  }

  updateGlobal(clientId: string, dto: UpdateClientDto): Observable<Client> {
    return this.http
      .patch<ApiResponse<Client>>(`${this.globalBaseUrl}/${clientId}`, dto)
      .pipe(map((response) => response.data!));
  }

  deleteGlobal(clientId: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.globalBaseUrl}/${clientId}`);
  }

  searchGlobalByDocumentNumber(documentNumber: string): Observable<Client[]> {
    return this.http
      .get<ApiResponse<Client[]>>(`${this.globalBaseUrl}/search/${documentNumber}`)
      .pipe(map((response) => response.data || []));
  }
}
