import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { environment } from '@environment/environment'
import { ApiData, ApiResponse } from '@core/interfaces/api/api-response.interface'
import {
  QueryRenewalEligible,
  ReminderRule,
  RenewalEligiblePatient,
  WhatsAppSession,
} from '@core/interfaces/api/notifications.interface'
import { Observable } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly API_URL = `${environment.apiBaseUrl}/notifications`

  constructor(private readonly http: HttpClient) {}

  getWhatsAppSession(): Observable<ApiResponse<WhatsAppSession>> {
    return this.http.get<ApiResponse<WhatsAppSession>>(
      `${this.API_URL}/whatsapp/session`
    )
  }

  initWhatsAppSession(): Observable<ApiResponse<WhatsAppSession>> {
    return this.http.post<ApiResponse<WhatsAppSession>>(
      `${this.API_URL}/whatsapp/session/init`,
      {}
    )
  }

  refreshWhatsAppQr(): Observable<ApiResponse<WhatsAppSession>> {
    return this.http.post<ApiResponse<WhatsAppSession>>(
      `${this.API_URL}/whatsapp/session/refresh-qr`,
      {}
    )
  }

  markWhatsAppConnected(
    connectedPhone?: string
  ): Observable<ApiResponse<WhatsAppSession>> {
    return this.http.post<ApiResponse<WhatsAppSession>>(
      `${this.API_URL}/whatsapp/session/mark-connected`,
      {
        connectedPhone: connectedPhone || null,
      }
    )
  }

  logoutWhatsAppSession(): Observable<ApiResponse<WhatsAppSession>> {
    return this.http.post<ApiResponse<WhatsAppSession>>(
      `${this.API_URL}/whatsapp/session/logout`,
      {}
    )
  }

  getReminderRule(): Observable<ApiResponse<ReminderRule>> {
    return this.http.get<ApiResponse<ReminderRule>>(`${this.API_URL}/reminders/rule`)
  }

  updateReminderRule(payload: Partial<ReminderRule>): Observable<ApiResponse<ReminderRule>> {
    return this.http.patch<ApiResponse<ReminderRule>>(
      `${this.API_URL}/reminders/rule`,
      payload
    )
  }

  getRenewalEligible(
    query: QueryRenewalEligible
  ): Observable<ApiResponse<ApiData<RenewalEligiblePatient[]>>> {
    const params = this.buildParams(query)

    return this.http.get<ApiResponse<ApiData<RenewalEligiblePatient[]>>>(
      `${this.API_URL}/reminders/renewal-eligible`,
      { params }
    )
  }

  sendManualRenewalReminder(payload: {
    patientIds: string[]
    messageTemplate?: string
  }): Observable<ApiResponse<{ total: number; sent: number; failed: number }>> {
    return this.http.post<ApiResponse<{ total: number; sent: number; failed: number }>>(
      `${this.API_URL}/reminders/renewal/manual-send`,
      payload
    )
  }

  private buildParams(query: QueryRenewalEligible): HttpParams {
    const source: Record<string, string> = {}

    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        source[key] = String(value)
      }
    })

    return new HttpParams({ fromObject: source })
  }
}
