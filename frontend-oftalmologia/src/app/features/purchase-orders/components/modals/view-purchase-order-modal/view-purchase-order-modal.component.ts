import { CommonModule } from '@angular/common'
import { Component, Input, OnInit, inject } from '@angular/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'

import {
  PurchaseOrder,
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
        return 'bg-success'
      case PurchaseOrderStatus.CANCELLED:
        return 'bg-danger'
      default:
        return 'bg-warning text-dark'
    }
  }
}