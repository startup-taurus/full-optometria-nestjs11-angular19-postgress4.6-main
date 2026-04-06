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
          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            title: 'Actualizado',
            text: 'La orden de pedido fue actualizada.',
          })
          this.activeModal.close('updated')
        },
        error: () => {
          this.isLoading = false
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: 'Error',
            text: 'No se pudo actualizar la orden de pedido.',
          })
        },
      })
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