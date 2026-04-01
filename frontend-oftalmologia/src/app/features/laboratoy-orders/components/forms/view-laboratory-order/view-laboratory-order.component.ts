import { Component, Input, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { LaboratoryOrdersService } from '@core/services/api/laboratory-orders.service'
import { LaboratoryOrder } from '@core/interfaces/api/laboratory-order.interface'

@Component({
  selector: 'app-view-laboratory-order',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './view-laboratory-order.component.html',
  styleUrls: ['./view-laboratory-order.component.scss'],
})
export class ViewLaboratoryOrderComponent implements OnInit {
  @Input() orderId: string | null = null
  @Input() order: LaboratoryOrder | null = null

  private _activeModal = inject(NgbActiveModal)
  private _laboratoryOrdersService = inject(LaboratoryOrdersService)
  private _translateService = inject(TranslateService)

  public loading = false
  public currentStep = 1
  public totalSteps = 4
  public stepTitles: string[] = []

  ngOnInit(): void {
    this.loadStepTitles()
    if (this.orderId && !this.order) {
      this.loadOrder()
    }
  }

  private loadStepTitles(): void {
    this.stepTitles = [
      this._translateService.instant('LABORATORY_ORDERS.STEP1_TITLE'),
      this._translateService.instant('LABORATORY_ORDERS.STEP2_TITLE'),
      this._translateService.instant('LABORATORY_ORDERS.STEP3_TITLE'),
      this._translateService.instant('LABORATORY_ORDERS.STEP4_TITLE'),
    ]
  }

  private loadOrder(): void {
    if (!this.orderId) return

    this.loading = true
    this._laboratoryOrdersService.getById(this.orderId).subscribe({
      next: (response: any) => {
        this.order = response.data || response || null
        this.loading = false
      },
      error: (error: any) => {
        this.loading = false
      },
    })
  }

  public goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step
    }
  }

  public goToNextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++
    }
  }

  public goToPreviousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--
    }
  }

  public canGoToNextStep(): boolean {
    return this.currentStep < this.totalSteps
  }

  public canGoToPreviousStep(): boolean {
    return this.currentStep > 1
  }

  public onClose(): void {
    this._activeModal.close()
  }

  public getFrameTypeLabel(value: string): string {
    const types: { [key: string]: string } = {
      '3_piezas_al_aire':
        'LABORATORY_ORDERS.FIELDS.FRAME_TYPES.3_PIEZAS_AL_AIRE',
      ranurado_semiaire:
        'LABORATORY_ORDERS.FIELDS.FRAME_TYPES.RANURADO_SEMIAIRE',
      completo: 'LABORATORY_ORDERS.FIELDS.FRAME_TYPES.COMPLETO',
    }
    return types[value] || value
  }

  public getOrderProductsText(): string {
    if (!this.order) return '-'

    const formatProduct = (product: {
      code?: string
      name?: string
      quantity?: number
    }) => {
      const code = product.code ? `${product.code} - ` : ''
      const name = product.name || '-'
      const quantity = Number(product.quantity || 0)
      const qtyLabel = quantity > 0 ? ` x${quantity}` : ''
      return `${code}${name}${qtyLabel}`
    }

    const lineItems = this.order.lineItems || []
    if (lineItems.length > 0) {
      return lineItems
        .map((lineItem) =>
          formatProduct({
            code: lineItem.product?.code,
            name: lineItem.product?.name,
            quantity: lineItem.quantity,
          })
        )
        .join(', ')
    }

    const products = this.order.products || []

    if (products.length > 0) {
      return products
        .map((product) =>
          formatProduct({
            code: product.code,
            name: product.name,
          })
        )
        .join(', ')
    }

    if (this.order.product) {
      return formatProduct({
        code: this.order.product.code,
        name: this.order.product.name,
      })
    }

    return this.order.frameModel || '-'
  }

  public getOrderProductRows(): Array<{
    code: string
    name: string
    brand: string
    stock: number | null
    quantity: number
  }> {
    if (!this.order) return []

    const lineItems = this.order.lineItems || []
    if (lineItems.length > 0) {
      return lineItems.map((lineItem) => ({
        code: lineItem.product?.code || '-',
        name: lineItem.product?.name || '-',
        brand: lineItem.product?.brand || '-',
        stock:
          typeof lineItem.product?.quantity === 'number'
            ? lineItem.product.quantity
            : null,
        quantity: Number(lineItem.quantity || 1),
      }))
    }

    const products = this.order.products || []
    if (products.length > 0) {
      return products.map((product) => ({
        code: product.code || '-',
        name: product.name || '-',
        brand: product.brand || '-',
        stock:
          typeof (product as any).quantity === 'number'
            ? (product as any).quantity
            : null,
        quantity: 1,
      }))
    }

    if (this.order.product) {
      return [
        {
          code: this.order.product.code || '-',
          name: this.order.product.name || '-',
          brand: this.order.product.brand || '-',
          stock:
            typeof (this.order.product as any).quantity === 'number'
              ? (this.order.product as any).quantity
              : null,
          quantity: 1,
        },
      ]
    }

    return []
  }

  public hasMultipleProducts(): boolean {
    return (this.order?.products?.length || 0) > 1
  }

  public formatDate(date: string | null): string {
    if (!date) return '-'
    const [year, month, day] = date.split('-')
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
}
