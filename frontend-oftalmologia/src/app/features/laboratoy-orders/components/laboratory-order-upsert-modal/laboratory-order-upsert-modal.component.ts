import { Component, Input, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { BaseStepModalComponent } from '../../../../shared/components/base-step-modal/base-step-modal.component'
import { LaboratoryOrdersService } from '@core/services/api/laboratory-orders.service'
import { BranchService } from '@core/services/api/branch.service'
import { LaboratoryOrderPdfService } from '@core/services/ui/laboratory-order-pdf.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import {
  CreateLaboratoryOrderDto,
  UpdateLaboratoryOrderDto,
  PreloadedOrderData,
  LaboratoryOrder,
  LaboratoryOrderLineItem,
} from '@core/interfaces/api/laboratory-order.interface'
import { LaboratoryOrderPdfData } from '@core/interfaces/ui/laboratory-order-pdf.interface'
import { Branch } from '@core/interfaces/api/user.interface'
import { LaboratoryOrderStatus } from '@core/interfaces/api/laboratory-order.interface'

import { LaboratoryOrderStep1Component } from '../steps/laboratory-order-step1/laboratory-order-step1.component'
import { LaboratoryOrderStep2Component } from '../steps/laboratory-order-step2/laboratory-order-step2.component'
import { LaboratoryOrderStep3Component } from '../steps/laboratory-order-step3/laboratory-order-step3.component'
import { LaboratoryOrderStep4Component } from '../steps/laboratory-order-step4/laboratory-order-step4.component'
import { firstValueFrom } from 'rxjs'
import Swal from 'sweetalert2'

export type ModalMode = 'create' | 'edit'

@Component({
  selector: 'app-laboratory-order-upsert-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    BaseStepModalComponent,
    LaboratoryOrderStep1Component,
    LaboratoryOrderStep2Component,
    LaboratoryOrderStep3Component,
    LaboratoryOrderStep4Component,
  ],
  templateUrl: './laboratory-order-upsert-modal.component.html',
  styleUrls: ['./laboratory-order-upsert-modal.component.scss'],
})
export class LaboratoryOrderUpsertModalComponent implements OnInit {
  @Input() mode: ModalMode = 'create'
  @Input() clinicalHistoryId?: string
  @Input() orderId?: string

  public activeModal = inject(NgbActiveModal)
  private _fb = inject(FormBuilder)
  private _laboratoryOrdersService = inject(LaboratoryOrdersService)
  private _branchService = inject(BranchService)
  private _pdfService = inject(LaboratoryOrderPdfService)
  private _notificationService = inject(ToastrNotificationService)
  private _translateService = inject(TranslateService)

  public currentStep = 1
  public totalSteps = 4
  public isLoading = false
  public isSaving = false

  public mainForm!: FormGroup
  public preloadedData: PreloadedOrderData | null = null

  public stepForms: { [key: number]: FormGroup } = {}
  public stepLabels: string[] = []

  get canProceedNext(): boolean {
    return this.stepForms[this.currentStep].valid
  }

  ngOnInit(): void {
    this.loadStepLabels()
    this.initializeForms()

    if (this.mode === 'create' && this.clinicalHistoryId) {
      this.loadPreloadedData()
    } else if (this.mode === 'edit' && this.orderId) {
      this.loadOrderData()
    }
  }

  private loadStepLabels(): void {
    this.stepLabels = [
      this._translateService.instant('LABORATORY_ORDERS.STEP1_TITLE'),
      this._translateService.instant('LABORATORY_ORDERS.STEP2_TITLE'),
      this._translateService.instant('LABORATORY_ORDERS.STEP3_TITLE'),
      this._translateService.instant('LABORATORY_ORDERS.STEP4_TITLE'),
    ]
  }

  private initializeForms(): void {
    this.stepForms[1] = this._fb.group({
      clientId: [null],
      attendanceDate: [this.getTodayDateString()],
      deliveryDate: [null, Validators.required],
    })

    this.stepForms[2] = this._fb.group({
      odSphere: [null],
      odCylinder: [null],
      odAxis: [null],
      odAdd: [null],
      odHeight: [null],
      odDnp: [null],
      oiSphere: [null],
      oiCylinder: [null],
      oiAxis: [null],
      oiAdd: [null],
      oiHeight: [null],
      oiDnp: [null],
      cbase: [null],
      sunDegree: [null],
      prism: [null],
      base: [null],
    })

    this.stepForms[3] = this._fb.group({
      dVertex: [null],
      pantos: [null],
      panora: [null],
      frameFit: [null],
      profile: [null],
      mid: [null],
      distVp: [null],
      engraving: [null],
      frameLargerDiameter: [null],
      frameHorizontal: [null],
      frameVertical: [null],
      frameBridge: [null],
      observations: [null],
    })

    this.stepForms[4] = this._fb.group({
      productIds: [[]],
      lineItems: [[] as LaboratoryOrderLineItem[]],
      frameType: [null],
      frameTypeDescription: [null],
      frameBrand: [null],
      frameModel: [null],
      frameData: [null],
    })

    this.mainForm = this._fb.group({
      step1: this.stepForms[1],
      step2: this.stepForms[2],
      step3: this.stepForms[3],
      step4: this.stepForms[4],
    })
  }

  private loadPreloadedData(): void {
    if (!this.clinicalHistoryId) return

    this.isLoading = true

    this._laboratoryOrdersService
      .getDataFromClinicalHistory(this.clinicalHistoryId)
      .subscribe({
        next: (data: PreloadedOrderData) => {
          this.preloadedData = data

          if (data.attendanceDate) {
            this.stepForms[1].patchValue({
              attendanceDate: data.attendanceDate,
            })
          }

          this.isLoading = false
        },
        error: (error: any) => {
          this.isLoading = false
        },
      })
  }

  private loadOrderData(): void {
    if (!this.orderId) return

    this.isLoading = true

    this._laboratoryOrdersService.getById(this.orderId).subscribe({
      next: (order: any) => {
        if (order.patient) {
          this.preloadedData = {
            patientId: order.patient.id || order.patientId,
            firstName: order.patient.firstName || '',
            lastName: order.patient.lastName || '',
            documentNumber: order.patient.documentNumber || '',
            email: order.patient.email || '',
            mobilePhone: order.patient.mobilePhone || '',
            homePhone: order.patient.homePhone || '',
            clinicalHistoryId: order.clinicalHistoryId,
          }
        }

        this.patchFormWithOrderData(order)
        this.isLoading = false
      },
      error: (error: any) => {
        this.isLoading = false
      },
    })
  }

  private patchFormWithOrderData(order: any): void {
    this.stepForms[1].patchValue({
      clientId: order.clientId || null,
      attendanceDate: order.attendanceDate,
      deliveryDate: order.deliveryDate,
    })

    this.stepForms[2].patchValue({
      odSphere: order.odSphere,
      odCylinder: order.odCylinder,
      odAxis: order.odAxis,
      odAdd: order.odAdd,
      odHeight: order.odHeight,
      odDnp: order.odDnp,
      oiSphere: order.oiSphere,
      oiCylinder: order.oiCylinder,
      oiAxis: order.oiAxis,
      oiAdd: order.oiAdd,
      oiHeight: order.oiHeight,
      oiDnp: order.oiDnp,
      cbase: order.cbase,
      sunDegree: order.sunDegree,
      prism: order.prism,
      base: order.base,
    })

    this.stepForms[3].patchValue({
      dVertex: order.dVertex,
      pantos: order.pantos,
      panora: order.panora,
      frameFit: order.frameFit,
      profile: order.profile,
      mid: order.mid,
      distVp: order.distVp,
      engraving: order.engraving,
      frameLargerDiameter: order.frameLargerDiameter,
      frameHorizontal: order.frameHorizontal,
      frameVertical: order.frameVertical,
      frameBridge: order.frameBridge,
      observations: order.observations,
    })

    this.stepForms[4].patchValue({
      productIds:
        order.productIds && order.productIds.length > 0
          ? order.productIds
          : order.productId
            ? [order.productId]
            : [],
      lineItems: Array.isArray(order.lineItems)
        ? order.lineItems.map((lineItem: LaboratoryOrderLineItem) => ({
            productId: lineItem.productId,
            quantity: Number(lineItem.quantity || 1),
            discount: Number(lineItem.discount || 0),
          }))
        : [],
      frameType: order.frameType,
      frameTypeDescription: order.frameTypeDescription,
      frameBrand: order.frameBrand,
      frameModel: order.frameModel,
      frameData: order.frameData,
    })
  }

  public onStepChange(step: number): void {
    if (step <= this.currentStep) {
      this.currentStep = step
      return
    }

    for (let i = 1; i < step; i++) {
      if (this.stepForms[i].invalid) {
        this.stepForms[i].markAllAsTouched()
        return
      }
    }

    this.currentStep = step
  }

  public onNextStep(): void {
    if (this.stepForms[this.currentStep].invalid) {
      this.stepForms[this.currentStep].markAllAsTouched()
      return
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++
    }
  }

  public onPreviousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--
    }
  }

  public onSave(): void {
    if (this.mainForm.invalid) {
      Object.keys(this.stepForms).forEach((key) => {
        this.stepForms[+key].markAllAsTouched()
      })
      return
    }

    this.isSaving = true

    if (this.mode === 'create') {
      const formValue = this.buildFormData() as CreateLaboratoryOrderDto

      if (!formValue.patientId) {
        this.isSaving = false
        this._notificationService.showNotification({
          type: 'error',
          message: {
            es: 'No se encontró el paciente para crear la orden.',
            en: 'Patient was not found to create the order.',
          },
          title: 'LABORATORY_ORDERS_MODULE.TITLE',
        })
        return
      }

      if (!formValue.clinicalHistoryId) {
        this.createOrder(formValue)
        return
      }

      this.preventActiveDuplicateOrder(formValue)
      return

    } else {
      const formValue = this.buildFormData() as UpdateLaboratoryOrderDto
      this.updateOrder(formValue)
    }
  }

  private preventActiveDuplicateOrder(data: CreateLaboratoryOrderDto): void {
    if (!data.patientId) {
      this.isSaving = false
      return
    }

    const queryParams = {
      page: 1,
      limit: 1000,
      patientFilterId: data.patientId,
    }

    this._laboratoryOrdersService.getAllWithFilters(queryParams).subscribe({
      next: (response) => {
        const orders = response?.data || []
        const hasActiveOrder = orders.some((order) => {
          if (order.clinicalHistoryId !== data.clinicalHistoryId) {
            return false
          }

          return this.normalizeOrderStatus(order) !== LaboratoryOrderStatus.CANCELLED
        })

        if (hasActiveOrder) {
          this.isSaving = false
          this._notificationService.showNotification({
            type: 'error',
            message: {
              es: 'Esta historia clínica ya tiene una orden de laboratorio activa. Cancela la orden actual para crear una nueva.',
              en: 'This clinical history already has an active laboratory order. Cancel the current order to create a new one.',
            },
            title: 'LABORATORY_ORDERS_MODULE.TITLE',
          })
          return
        }

        this.createOrder(data)
      },
      error: () => {
        this.isSaving = false
        this._notificationService.showNotification({
          type: 'warning',
          message: {
            es: 'No se pudo validar si ya existe una orden activa. Intenta nuevamente.',
            en: 'Could not validate whether an active order already exists. Please try again.',
          },
          title: 'LABORATORY_ORDERS_MODULE.TITLE',
        })
      },
    })
  }

  private normalizeOrderStatus(order: LaboratoryOrder): LaboratoryOrderStatus {
    if (order.status) {
      return order.status
    }

    return order.isConfirmed
      ? LaboratoryOrderStatus.RECEIVED
      : LaboratoryOrderStatus.PENDING
  }

  private buildFormData(): CreateLaboratoryOrderDto | UpdateLaboratoryOrderDto {
    const data: any = {
      ...this.stepForms[1].value,
      ...this.stepForms[2].value,
      ...this.stepForms[3].value,
      ...this.stepForms[4].value,
    }

    // clientId es opcional, pero si viene del select como objeto debe enviarse solo su UUID.
    if (data.clientId && typeof data.clientId === 'object') {
      data.clientId = data.clientId.id || null
    }

    // Si no es UUID válido, no se envía para evitar error de validación en backend.
    if (
      data.clientId &&
      (typeof data.clientId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          data.clientId
        ))
    ) {
      data.clientId = null
    }

    if (!data.clientId) {
      delete data.clientId
    }

    if (this.clinicalHistoryId) {
      data.clinicalHistoryId = this.clinicalHistoryId
    }

    if (this.preloadedData?.patientId) {
      data.patientId = this.preloadedData.patientId
    }

    return data
  }

  private createOrder(data: CreateLaboratoryOrderDto): void {
    this._laboratoryOrdersService.create(data).subscribe({
      next: async (response: any) => {
        this.isSaving = false

        this._notificationService.showNotification({
          type: 'success',
          message: response.message || {
            es: 'Orden creada exitosamente',
            en: 'Order created successfully',
          },
          title: 'LABORATORY_ORDERS_MODULE.TITLE',
        })

        try {
          await this.generateOrderPdf(response.data || response)
        } catch (error) {
          this._notificationService.showNotification({
            type: 'warning',
            message: {
              es: 'Orden creada pero hubo un error al generar el PDF',
              en: 'Order created but there was an error generating the PDF',
            },
            title: 'LABORATORY_ORDERS_MODULE.TITLE',
          })
        }

        this.activeModal.close({ success: true, data: response })
      },
      error: (error: any) => {
        this.isSaving = false

        const stockPayload = this.extractStockValidationPayload(error)
        if (stockPayload?.stockValidation) {
          this.confirmCreateDespiteStock(data)
        }
      },
    })
  }

  private extractStockValidationPayload(error: any): any {
    return (
      error?.error?.data ||
      error?.originalError?.error?.data ||
      null
    )
  }

  private confirmCreateDespiteStock(data: CreateLaboratoryOrderDto): void {
    Swal.fire({
      icon: 'warning',
      title: 'Stock insuficiente',
      text: 'Las cantidades exceden el stock disponible. Puedes volver a editar o generar la orden de todas formas.',
      showCancelButton: true,
      confirmButtonText: 'Generar de todas formas',
      cancelButtonText: 'Volver a editar',
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) {
        return
      }

      this.isSaving = true
      const forceData: CreateLaboratoryOrderDto = {
        ...data,
        ignoreStockValidation: true,
      }
      this.createOrder(forceData)
    })
  }

  private updateOrder(data: UpdateLaboratoryOrderDto): void {
    if (!this.orderId) return

    this._laboratoryOrdersService.update(this.orderId, data).subscribe({
      next: (response: any) => {
        this.isSaving = false

        this._notificationService.showNotification({
          type: 'success',
          message: response.message || {
            es: 'Orden actualizada exitosamente',
            en: 'Order updated successfully',
          },
          title: 'LABORATORY_ORDERS_MODULE.TITLE',
        })

        this.activeModal.close({ success: true, data: response })
      },
      error: () => {
        this.isSaving = false
        // El interceptor global ya muestra el mensaje de error localizado
      },
    })
  }

  public onCancel(): void {
    this.activeModal.dismiss('cancel')
  }

  private async generateOrderPdf(order: LaboratoryOrder): Promise<void> {
    try {
      const branchState = await firstValueFrom(
        this._branchService.getBranchFilterState()
      )

      const branchId = branchState.selectedBranchId || order.branchId
      if (!branchId) {
        throw new Error('No se pudo obtener el ID de la sucursal')
      }

      const currentBranch = await firstValueFrom(
        this._branchService.getBranchById(branchId)
      )

      if (!currentBranch) {
        throw new Error('No se pudo obtener la información de la sucursal')
      }

      const orderNumber = this.formatOrderNumber(order.orderNumber || 0)

      const pdfData: LaboratoryOrderPdfData = {
        order: order,
        branch: currentBranch,
        orderNumber: orderNumber,
      }

      const filename = `orden_laboratorio_${orderNumber}.pdf`
      await this._pdfService.downloadPdf(pdfData, filename)
    } catch (error) {
      throw error
    }
  }

  private formatOrderNumber(orderNumber: number): string {
    return orderNumber.toString().padStart(9, '0')
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0]
  }
}
