import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { BranchAwareService } from './branch-aware.service'
import { BranchService } from './branch.service'
import {
  MedicalHistory,
  MedicalRecord,
  Diagnosis,
  Treatment,
} from '../../interfaces/api/modules.interface'

@Injectable({
  providedIn: 'root',
})
export class MedicalHistoryService extends BranchAwareService<MedicalHistory> {
  constructor(
    protected override http: HttpClient,
    protected override branchService: BranchService
  ) {
    super(http, branchService, 'medical-history')
  }

  getAllHistories(): Observable<MedicalHistory[]> {
    return this.getAll()
  }

  getHistoriesByPatient(patientId: string): Observable<MedicalHistory[]> {
    return this.http
      .get<any>(`${this.baseUrl}/patient/${patientId}`)
      .pipe(map((response: any) => response.data?.data?.result || []))
  }

  getHistoryById(id: string): Observable<MedicalHistory | null> {
    return this.getById(id)
  }

  getHistoriesByDoctor(doctorId: string): Observable<MedicalHistory[]> {
    return this.http
      .get<any>(`${this.baseUrl}/doctor/${doctorId}`)
      .pipe(map((response: any) => response.data?.data?.result || []))
  }

  getHistoriesByDateRange(
    startDate: string,
    endDate: string
  ): Observable<MedicalHistory[]> {
    return this.http
      .get<any>(`${this.baseUrl}/date-range`, {
        params: { startDate, endDate },
      })
      .pipe(map((response: any) => response.data?.data?.result || []))
  }

  createHistory(
    history: Partial<MedicalHistory>
  ): Observable<MedicalHistory | null> {
    return this.create(history)
  }

  updateHistory(
    id: string,
    history: Partial<MedicalHistory>
  ): Observable<MedicalHistory | null> {
    return this.update(id, history)
  }

  addMedicalRecord(
    historyId: string,
    record: Partial<MedicalRecord>
  ): Observable<MedicalRecord> {
    return this.http
      .post<any>(`${this.baseUrl}/${historyId}/records`, record)
      .pipe(map((response: any) => response.data?.data?.result))
  }

  updateMedicalRecord(
    historyId: string,
    recordId: string,
    record: Partial<MedicalRecord>
  ): Observable<MedicalRecord> {
    return this.http
      .put<any>(`${this.baseUrl}/${historyId}/records/${recordId}`, record)
      .pipe(map((response: any) => response.data?.data?.result))
  }

  addDiagnosis(
    historyId: string,
    diagnosis: Partial<Diagnosis>
  ): Observable<Diagnosis> {
    return this.http
      .post<any>(`${this.baseUrl}/${historyId}/diagnoses`, diagnosis)
      .pipe(map((response: any) => response.data?.data?.result))
  }

  addTreatment(
    historyId: string,
    treatment: Partial<Treatment>
  ): Observable<Treatment> {
    return this.http
      .post<any>(`${this.baseUrl}/${historyId}/treatments`, treatment)
      .pipe(map((response: any) => response.data?.data?.result))
  }

  getDiagnosesByPatient(patientId: string): Observable<Diagnosis[]> {
    return this.http
      .get<any>(`${this.baseUrl}/patient/${patientId}/diagnoses`)
      .pipe(map((response: any) => response.data?.data?.result || []))
  }

  getActiveTreatmentsByPatient(patientId: string): Observable<Treatment[]> {
    return this.http
      .get<any>(`${this.baseUrl}/patient/${patientId}/treatments/active`)
      .pipe(map((response: any) => response.data?.data?.result || []))
  }

  searchHistories(query: string): Observable<MedicalHistory[]> {
    return this.http
      .get<any>(`${this.baseUrl}/search`, {
        params: { q: query },
      })
      .pipe(map((response: any) => response.data?.data?.result || []))
  }

  getHistoryStatistics(patientId?: string): Observable<any> {
    const url = `${this.baseUrl}/statistics`
    if (patientId) {
      return this.http
        .get<any>(url, { params: { patientId } })
        .pipe(map((response: any) => response.data?.data?.result))
    } else {
      return this.http
        .get<any>(url)
        .pipe(map((response: any) => response.data?.data?.result))
    }
  }
}
