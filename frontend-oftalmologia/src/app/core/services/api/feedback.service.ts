import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { environment } from '@environment/environment'
import { Observable } from 'rxjs'
import {
  ApiData,
  ApiResponse,
} from '@core/interfaces/api/api-response.interface'
import {
  FeedbackItem,
  FeedbackQueryParams,
  FeedbackStatus,
} from '@core/interfaces/api/feedback.interface'

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private readonly API_URL = `${environment.apiBaseUrl}/feedback`

  constructor(private readonly http: HttpClient) {}

  createFeedback(payload: {
    title: string
    description: string
    type: string
    files?: File[]
  }): Observable<ApiResponse<FeedbackItem>> {
    const formData = new FormData()
    formData.append('title', payload.title)
    formData.append('description', payload.description)
    formData.append('type', payload.type)

    payload.files?.forEach((file) => formData.append('files', file))

    return this.http.post<ApiResponse<FeedbackItem>>(this.API_URL, formData)
  }

  getFeedback(
    query: FeedbackQueryParams
  ): Observable<ApiResponse<ApiData<FeedbackItem[]>>> {
    return this.http.get<ApiResponse<ApiData<FeedbackItem[]>>>(this.API_URL, {
      params: this.buildParams(query),
    })
  }

  getFeedbackAdmin(
    query: FeedbackQueryParams
  ): Observable<ApiResponse<ApiData<FeedbackItem[]>>> {
    return this.http.get<ApiResponse<ApiData<FeedbackItem[]>>>(
      `${this.API_URL}/admin/list`,
      {
        params: this.buildParams(query),
      }
    )
  }

  getFeedbackById(feedbackId: string): Observable<ApiResponse<FeedbackItem>> {
    return this.http.get<ApiResponse<FeedbackItem>>(
      `${this.API_URL}/${feedbackId}`
    )
  }

  updateStatus(
    feedbackId: string,
    status: FeedbackStatus
  ): Observable<ApiResponse<FeedbackItem>> {
    return this.http.patch<ApiResponse<FeedbackItem>>(
      `${this.API_URL}/${feedbackId}/status`,
      { status }
    )
  }

  removeFeedback(feedbackId: string): Observable<ApiResponse<{ id: string }>> {
    return this.http.delete<ApiResponse<{ id: string }>>(
      `${this.API_URL}/${feedbackId}`
    )
  }

  private buildParams(query: FeedbackQueryParams): HttpParams {
    const source: Record<string, string> = {}

    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        source[key] = String(value)
      }
    })

    return new HttpParams({ fromObject: source })
  }
}
