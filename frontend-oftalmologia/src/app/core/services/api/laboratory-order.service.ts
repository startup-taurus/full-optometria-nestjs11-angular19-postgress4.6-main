import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, map } from 'rxjs'
import { environment } from '@environment/environment'
import { BranchAwareService } from './branch-aware.service'
import { BranchService } from './branch.service'
import {
  LaboratoryOrder,
  LaboratoryTest,
} from '@core/interfaces/api/modules.interface'

@Injectable({
  providedIn: 'root',
})
export class LaboratoryOrderService extends BranchAwareService<LaboratoryOrder> {
  constructor(
    protected override http: HttpClient,
    protected override branchService: BranchService
  ) {
    super(http, branchService, 'laboratory-orders')
  }

  /**
   * Obtiene todas las órdenes de laboratorio con filtrado por sucursal
   */
  getAllOrders(): Observable<LaboratoryOrder[]> {
    return this.getAllReactive()
  }

  /**
   * Obtiene órdenes por estado
   */
  getOrdersByStatus(status: string): Observable<LaboratoryOrder[]> {
    return this.http
      .get<any>(`${this.baseUrl}/status/${status}`)
      .pipe(map((response: any) => response.data?.data?.result || []))
  }

  /**
   * Obtiene órdenes por paciente
   */
  getOrdersByPatient(patientId: string): Observable<LaboratoryOrder[]> {
    return this.http
      .get<any>(`${this.baseUrl}/patient/${patientId}`)
      .pipe(map((response: any) => response.data?.data?.result || []))
  }

  /**
   * Obtiene órdenes por doctor
   */
  getOrdersByDoctor(doctorId: string): Observable<LaboratoryOrder[]> {
    return this.http
      .get<any>(`${this.baseUrl}/doctor/${doctorId}`)
      .pipe(map((response: any) => response.data?.data?.result || []))
  }

  /**
   * Crea una nueva orden de laboratorio
   */
  createOrder(
    order: Partial<LaboratoryOrder>
  ): Observable<LaboratoryOrder | null> {
    return this.create(order)
  }

  /**
   * Actualiza una orden existente
   */
  updateOrder(
    id: string,
    order: Partial<LaboratoryOrder>
  ): Observable<LaboratoryOrder | null> {
    return this.update(id, order)
  }

  /**
   * Obtiene los tests de laboratorio disponibles
   */
  getAvailableTests(): Observable<LaboratoryTest[]> {
    return this.http
      .get<any>(`${this.baseUrl}/tests`)
      .pipe(map((response) => response.data?.data?.result || []))
  }

  /**
   * Cancela una orden
   */
  cancelOrder(id: string, reason?: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/cancel`, { reason })
  }

  /**
   * Completa una orden
   */
  completeOrder(id: string, results: any): Observable<LaboratoryOrder | null> {
    return this.http
      .put<any>(`${this.baseUrl}/${id}/complete`, { results })
      .pipe(map((response) => response.data || null))
  }
}
