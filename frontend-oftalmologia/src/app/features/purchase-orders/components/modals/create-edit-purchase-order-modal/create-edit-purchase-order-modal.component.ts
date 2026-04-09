import { CommonModule } from '@angular/common'
import { Component, Input, OnInit, inject } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import Swal from 'sweetalert2'

import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '@core/interfaces/api/purchase-order.interface'
import { PurchaseOrdersService } from '@core/services/api/purchase-orders.service'
import {
  SWAL_ERROR_CONFIG,
  SWAL_SUCCESS_CONFIG,
} from '@core/helpers/ui/ui.constants'

@Component({
  selector: 'create-edit-purchase-order-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './create-edit-purchase-order-modal.component.html',
  styleUrl: './create-edit-purchase-order-modal.component.scss',
})
export class CreateEditPurchaseOrderModalComponent implements OnInit {
  @Input() purchaseOrder?: PurchaseOrder

  public form!: FormGroup
  public isLoading = false
  public purchaseOrderStatus = PurchaseOrderStatus

  public activeModal = inject(NgbActiveModal)
  private fb = inject(FormBuilder)
  private purchaseOrdersService = inject(PurchaseOrdersService)

  ngOnInit(): void {
    this.initializeForm()
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      status: [this.purchaseOrder?.status || PurchaseOrderStatus.PENDING, Validators.required],
      shouldInvoice: [this.purchaseOrder?.shouldInvoice ?? false],
    })
  }

  public onSubmit(): void {
    if (!this.purchaseOrder?.id || this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched()
      return
    }

    this.isLoading = true

    this.purchaseOrdersService
      .update(this.purchaseOrder.id, {
        status: this.form.value.status,
        shouldInvoice: this.form.value.shouldInvoice,
      })
      .subscribe({
        next: () => {
          this.isLoading = false
          const isCancellation =
            this.form.value.status === PurchaseOrderStatus.CANCELLED

          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            title: isCancellation ? 'Cancelada' : 'Actualizado',
            text: isCancellation
              ? 'La orden de pedido fue cancelada.'
              : 'La orden de pedido fue actualizada.',
          })
          this.activeModal.close('updated')
        },
        error: (error: any) => {
          this.isLoading = false
          const errorMessage = this.getErrorMessage(
            error,
            'No se pudo actualizar la orden de pedido.'
          );

          // Handle insufficient stock for reactivation
          if (error.error?.messageKey === 'REACTIVATION.INSUFFICIENT_STOCK' && error.error?.details?.length > 0) {
            const insufficientProducts = error.error.details;
            const productsList = insufficientProducts
              .map((p: any) => `<li>${p.productName}: disponible ${p.available}, necesario ${p.needed}</li>`)
              .join('');

            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: 'Error',
              html: `<p>${errorMessage}</p><ul style="text-align: left;">${productsList}</ul>`,
            });
          } else {
            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: 'Error',
              text: errorMessage,
            });
          }
        },
      })
  }

  private getErrorMessage(error: any, fallback: string): string {
    return (
      error?.error?.message?.es ||
      error?.error?.message?.en ||
      error?.error?.data?.localizedMessage?.es ||
      error?.error?.data?.localizedMessage?.en ||
      error?.error?.data?.error ||
      fallback
    )
  }

  public isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  public getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName)

    if (field?.errors?.['required']) {
      return 'VALIDATION.REQUIRED'
    }

    return ''
  }
}