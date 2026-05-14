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
import {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
} from '@core/interfaces/api/patient.interface'

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  public API_URL = `${environment.apiBaseUrl}/patients`

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

  public createPatient(
    patient: CreatePatientDto
  ): Observable<ApiResponse<Patient>> {
    return this._httpClient
      .post<ApiResponse<Patient>>(this.API_URL, patient)
      .pipe(tap((res) => this.showNotification(res.message, 'PATIENT.TITLE')))
  }

  public findPatients(
    filter: object
  ): Observable<ApiResponse<ApiData<Patient[]>>> {
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
      .get<ApiResponse<ApiData<Patient[]>>>(this.API_URL, { params })
      .pipe(
        tap({
          next: (response) => {},
          error: () => {},
        })
      )
  }

  public updatePatient(
    id: string,
    patient: UpdatePatientDto
  ): Observable<ApiResponse<Patient>> {
    const endpoint = `${this.API_URL}/${id}`
    return this._httpClient
      .patch<ApiResponse<Patient>>(endpoint, patient)
      .pipe(tap((res) => this.showNotification(res.message, 'PATIENT.TITLE')))
  }

  public getPatientById(id: string): Observable<ApiResponse<Patient>> {
    const endpoint = `${this.API_URL}/${id}`
    return this._httpClient.get<ApiResponse<Patient>>(endpoint).pipe(
      tap({
        next: (response) => {},
        error: (error) => {},
      })
    )
  }

  public deletePatient(
    id: string,
    deleteAssociatedClients: boolean = false
  ): Observable<ApiResponse<Patient>> {
    const endpoint = `${this.API_URL}/${id}`
    let params = new HttpParams()

    if (deleteAssociatedClients) {
      params = params.set('deleteAssociatedClients', 'true')
    }

    return this._httpClient
      .delete<ApiResponse<Patient>>(endpoint, { params })
      .pipe(tap((res) => this.showNotification(res.message, 'PATIENT.TITLE')))
  }

  public searchPatients(query: string): Observable<ApiResponse<Patient[]>> {
    const endpoint = `${this.API_URL}/search`
    const params = new HttpParams().set('q', query)

    return this._httpClient
      .get<ApiResponse<Patient[]>>(endpoint, { params })
      .pipe(
        catchError((error) => {
          throw error
        })
      )
  }

  public getPatientsByBranch(
    branchId?: string,
    search?: string
  ): Observable<Patient[]> {
    const filter: any = {
      isActive: true,
      limit: 100,
      page: 1,
    }

    if (branchId) {
      filter.branchId = branchId
    }

    if (search && search.length >= 2) {
      filter.search = search
    }

    return this.findPatients(filter).pipe(
      map((response: ApiResponse<ApiData<Patient[]>>) => {
        if (response.data && response.data.result) {
          return response.data.result
        }
        return []
      }),
      catchError((error) => {
        return []
      })
    )
  }

  public uploadProfilePhoto(
    id: string,
    file: File
  ): Observable<ApiResponse<Patient>> {
    const formData = new FormData()
    formData.append('file', file)

    const endpoint = `${this.API_URL}/${id}/profile-photo`
    return this._httpClient
      .post<ApiResponse<Patient>>(endpoint, formData)
      .pipe(tap((res) => this.showNotification(res.message, 'PATIENT.TITLE')))
  }

  private showNotification(
    message: ApiMessage,
    title: string = 'PATIENT.TITLE'
  ): void {
    this._notificationService.showNotification({
      title,
      message,
      type: 'success',
    })
  }
}
