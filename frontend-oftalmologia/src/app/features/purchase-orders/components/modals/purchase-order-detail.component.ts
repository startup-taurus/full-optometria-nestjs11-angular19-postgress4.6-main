import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PurchaseOrder } from '@core/interfaces/api/purchase-order.interface';
import { PurchaseOrdersService } from '@core/services/api/purchase-orders.service';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="modal fade" [id]="modalId" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ 'PURCHASE_ORDERS.DETAIL' | translate }}</h5>
            <button type="button" class="btn-close" aria-label="Close" (click)="closeModal()"></button>
          </div>

          <div class="modal-body" *ngIf="purchaseOrder && !loading">
            <div class="row mb-3">
              <div class="col-md-6">
                <strong>{{ 'PURCHASE_ORDERS.NUMBER' | translate }}:</strong>
                <p>{{ purchaseOrder.orderNumber }}</p>
              </div>
              <div class="col-md-6">
                <strong>{{ 'PURCHASE_ORDERS.STATUS' | translate }}:</strong>
                <p>
                  <span class="badge" [ngClass]="getStatusClass(purchaseOrder.status)">
                    {{ 'PURCHASE_ORDERS.STATUS_' + purchaseOrder.status.toUpperCase() | translate }}
                  </span>
                </p>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <strong>{{ 'CLIENT.SINGULAR' | translate }}:</strong>
                <p>
                  {{ getDisplayClientName() }}<br />
                  <small class="text-muted">{{ getDisplayClientDocument() }}</small>
                </p>
              </div>
              <div class="col-md-6">
                <strong>{{ 'PURCHASE_ORDERS.TOTAL_AMOUNT' | translate }}:</strong>
                <p>{{ purchaseOrder.totalAmount | currency }}</p>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <strong>{{ 'PURCHASE_ORDERS.SHOULD_INVOICE' | translate }}:</strong>
                <p>
                  <span class="badge" [ngClass]="purchaseOrder.shouldInvoice ? 'bg-success' : 'bg-secondary'">
                    {{ (purchaseOrder.shouldInvoice ? 'COMMON.YES' : 'COMMON.NO') | translate }}
                  </span>
                </p>
              </div>
              <div class="col-md-6">
                <strong>{{ 'COMMON.CREATED_AT' | translate }}:</strong>
                <p>{{ purchaseOrder.createdAt | date: 'short' }}</p>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-12">
                <strong>{{ 'PURCHASE_ORDERS.FIELDS.LAB_ORDER' | translate }}:</strong>
                <p *ngIf="purchaseOrder.laboratoryOrder">
                  {{ purchaseOrder.laboratoryOrder.id }}<br />
                  <small class="text-muted">
                    {{ purchaseOrder.laboratoryOrder.createdAt | date: 'short' }}
                  </small>
                </p>
              </div>
            </div>
          </div>

          <div class="modal-body" *ngIf="loading">
            <div class="text-center">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">{{ 'COMMON.LOADING' | translate }}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">
              {{ 'COMMON.CLOSE' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PurchaseOrderDetailComponent implements OnInit {
  private static readonly FINAL_CONSUMER_NAME = 'Consumidor Final';
  private static readonly FINAL_CONSUMER_DOCUMENT = '9999999999999';

  @Input() modalId = 'purchaseOrderDetailModal';
  @Input() purchaseOrderId?: string;

  public purchaseOrder: PurchaseOrder | null = null;
  public loading = false;

  private _purchaseOrdersService = inject(PurchaseOrdersService);
  private modal?: any;

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      const { Modal } = require('bootstrap');
      const modalEl = document.getElementById(this.modalId);
      if (modalEl) {
        this.modal = new Modal(modalEl);
      }
    }
  }

  loadPurchaseOrder(id: string): void {
    this.loading = true;
    this.purchaseOrderId = id;
    this._purchaseOrdersService.getById(id).subscribe({
      next: (response) => {
        this.purchaseOrder = response || null;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  openModal(): void {
    if (this.purchaseOrderId) {
      this.loadPurchaseOrder(this.purchaseOrderId);
    }
    this.modal?.show();
  }

  closeModal(): void {
    this.modal?.hide();
    this.purchaseOrder = null;
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      pending: 'bg-warning',
      invoiced: 'bg-success',
      cancelled: 'bg-danger',
    };
    return statusClasses[status] || 'bg-secondary';
  }

  getDisplayClientName(): string {
    if (this.purchaseOrder?.client) {
      return `${this.purchaseOrder.client.lastName || ''} ${this.purchaseOrder.client.firstName || ''}`.trim();
    }

    return PurchaseOrderDetailComponent.FINAL_CONSUMER_NAME;
  }

  getDisplayClientDocument(): string {
    return (
      this.purchaseOrder?.client?.documentNumber ||
      PurchaseOrderDetailComponent.FINAL_CONSUMER_DOCUMENT
    );
  }
}

