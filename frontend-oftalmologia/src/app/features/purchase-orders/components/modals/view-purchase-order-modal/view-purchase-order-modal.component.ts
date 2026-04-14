import { CommonModule } from '@angular/common'
import { Component, Input, OnInit, inject } from '@angular/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import {
  PurchaseOrder,
  PurchaseOrderInvoiceState,
  PurchaseOrderStatus,
} from '@core/interfaces/api/purchase-order.interface'
import { PurchaseOrdersService } from '@core/services/api/purchase-orders.service'

@Component({
  selector: 'view-purchase-order-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './view-purchase-order-modal.component.html',
  styleUrl: './view-purchase-order-modal.component.scss',
})
export class ViewPurchaseOrderModalComponent implements OnInit {
  @Input() orderId?: string

  public purchaseOrder: PurchaseOrder | null = null
  public isLoading = false

  public activeModal = inject(NgbActiveModal)
  private purchaseOrdersService = inject(PurchaseOrdersService)
  private translateService = inject(TranslateService)

  ngOnInit(): void {
    if (this.orderId) {
      this.loadOrder(this.orderId)
    }
  }

  private loadOrder(orderId: string): void {
    this.isLoading = true

    this.purchaseOrdersService.getById(orderId).subscribe({
      next: (order) => {
        this.purchaseOrder = order
        this.isLoading = false
      },
      error: () => {
        this.isLoading = false
      },
    })
  }

  public getStatusBadgeClass(status: PurchaseOrderStatus): string {
    switch (status) {
      case PurchaseOrderStatus.INVOICED:
        return 'text-bg-success'
      case PurchaseOrderStatus.CANCELLED:
        return 'text-bg-danger'
      default:
        return 'text-bg-warning'
    }
  }

  public getInvoiceBadgeClass(state?: PurchaseOrderInvoiceState | null): string {
    switch (state) {
      case PurchaseOrderInvoiceState.AUTHORIZED:
      case PurchaseOrderInvoiceState.APPROVED:
        return 'text-bg-success'
      case PurchaseOrderInvoiceState.FAILED:
      case PurchaseOrderInvoiceState.NOT_APPROVED:
      case PurchaseOrderInvoiceState.RETURNED:
        return 'text-bg-danger'
      case PurchaseOrderInvoiceState.NEW:
      default:
        return 'text-bg-warning'
    }
  }

  public getShouldInvoiceBadgeClass(shouldInvoice: boolean): string {
    return shouldInvoice ? 'text-bg-success' : 'text-bg-secondary'
  }

  public getInvoiceStateLabelKey(order: PurchaseOrder): string {
    if (!order.shouldInvoice) {
      return 'PURCHASE_ORDERS.BILLING.STATE.NOT_APPLICABLE'
    }

    if (!order.invoice) {
      return 'PURCHASE_ORDERS.BILLING.STATE.PENDING_ISSUE'
    }

    switch (order.invoice.state) {
      case PurchaseOrderInvoiceState.AUTHORIZED:
        return 'PURCHASE_ORDERS.BILLING.STATE.AUTHORIZED'
      case PurchaseOrderInvoiceState.APPROVED:
        return 'PURCHASE_ORDERS.BILLING.STATE.APPROVED'
      case PurchaseOrderInvoiceState.RETURNED:
        return 'PURCHASE_ORDERS.BILLING.STATE.RETURNED'
      case PurchaseOrderInvoiceState.NOT_APPROVED:
        return 'PURCHASE_ORDERS.BILLING.STATE.NOT_APPROVED'
      case PurchaseOrderInvoiceState.FAILED:
        return 'PURCHASE_ORDERS.BILLING.STATE.FAILED'
      case PurchaseOrderInvoiceState.NEW:
      default:
        return 'PURCHASE_ORDERS.BILLING.STATE.CREATED'
    }
  }

  public getPaymentMethodLabel(paymentMethod?: string | null): string {
    const code = String(paymentMethod || '').trim()
    if (!code) {
      return '-'
    }

    switch (code) {
      case '01':
        return this.translateService.instant(
          'PURCHASE_ORDERS.FILTERS.PAYMENT_METHOD_01'
        )
      case '16':
        return this.translateService.instant(
          'PURCHASE_ORDERS.FILTERS.PAYMENT_METHOD_16'
        )
      case '19':
        return this.translateService.instant(
          'PURCHASE_ORDERS.FILTERS.PAYMENT_METHOD_19'
        )
      case '20':
        return this.translateService.instant(
          'PURCHASE_ORDERS.FILTERS.PAYMENT_METHOD_20'
        )
      default:
        return code
    }
  }

  public formatDateTime(value?: string | null): string {
    if (!value) {
      return '-'
    }

    const dateValue = new Date(value)
    if (Number.isNaN(dateValue.getTime())) {
      return value
    }

    return dateValue.toLocaleString()
  }

  public getPurchaseOrderItems() {
    return this.purchaseOrder?.items || []
  }

  public getItemAmount(item: { quantity?: number; unitPrice?: number }): number {
    const quantity = Number(item.quantity || 0)
    const unitPrice = Number(item.unitPrice || 0)
    return Number((quantity * unitPrice).toFixed(2))
  }

  public formatCurrency(value?: number | string | null): string {
    const amount = Number(value || 0)
    if (!Number.isFinite(amount)) {
      return '$0.00'
    }

    return `$${amount.toFixed(2)}`
  }
}