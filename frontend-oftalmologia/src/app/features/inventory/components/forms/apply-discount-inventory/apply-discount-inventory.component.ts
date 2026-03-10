import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core'
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms'
import { Product } from '@core/interfaces/api/inventory.interface'
import {
  ApplyDiscountPayload,
  ProductsManagementService,
} from '@core/services/api/products-management.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'

interface ApplyDiscountModalData {
  selectedRow?: Product & {
    discount?: {
      type: 'PERCENTAGE' | 'FIXED_AMOUNT'
      value: number
      startDate?: string | null
      endDate?: string | null
    }
    hasActiveDiscount?: boolean
  }
}

@Component({
  selector: 'apply-discount-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './apply-discount-inventory.component.html',
  styleUrl: './apply-discount-inventory.component.scss',
})
export class ApplyDiscountInventoryComponent implements OnInit, OnDestroy {
  public form!: FormGroup
  public isLoading = false
  public product?: ApplyDiscountModalData['selectedRow']
  public errorMessage: string | null = null
  public readonly finalPriceValue = signal<number>(0)

  private unsubscribe$ = new Subject<void>()

  private _activeModal = inject(NgbActiveModal)
  private _fb = inject(FormBuilder)
  private _productsManagementService = inject(ProductsManagementService)
  private _bsModalService = inject(BootstrapModalService<ApplyDiscountModalData>)

  ngOnInit(): void {
    this.initializeForm()
    this.loadModalData()
    this.watchDiscountType()
    this.form.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this._updateFinalPrice()
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  private initializeForm(): void {
    this.form = this._fb.group(
      {
        discountType: ['PERCENTAGE', [Validators.required]],
        discountValue: [null, [Validators.required, Validators.min(0.01)]],
        startDate: [null],
        endDate: [null],
        isActive: [true],
      },
      { validators: [this.endDateAfterStartDateValidator()] }
    )
  }

  private loadModalData(): void {
    this._bsModalService
      .getDataIssued()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: ApplyDiscountModalData) => {
        this.product = data?.selectedRow

        if (!this.product?.discount) {
          this._updateFinalPrice()
          return
        }

        this.form.patchValue({
          discountType: this.product.discount.type,
          discountValue: this.product.discount.value,
          startDate: this.product.discount.startDate
            ? this.toDateInputValue(this.product.discount.startDate)
            : null,
          endDate: this.product.discount.endDate
            ? this.toDateInputValue(this.product.discount.endDate)
            : null,
          isActive: this.product.hasActiveDiscount ?? true,
        })
        this._updateFinalPrice()
      })
  }

  private watchDiscountType(): void {
    this.form
      .get('discountType')
      ?.valueChanges.pipe(takeUntil(this.unsubscribe$))
      .subscribe((value: 'PERCENTAGE' | 'FIXED_AMOUNT') => {
        const validators = [Validators.required, Validators.min(0.01)]
        if (value === 'PERCENTAGE') {
          validators.push(Validators.max(100))
        }

        const control = this.form.get('discountValue')
        control?.setValidators(validators)
        control?.updateValueAndValidity()
      })
  }

  private _updateFinalPrice(): void {
    if (!this.product) {
      this.finalPriceValue.set(0)
      return
    }
    const price = Number(this.product.unitPrice) || 0
    const type = this.form?.get('discountType')?.value as
      | 'PERCENTAGE'
      | 'FIXED_AMOUNT'
      | undefined
    const value = Number(this.form?.get('discountValue')?.value) || 0

    if (!type || value <= 0) {
      this.finalPriceValue.set(price)
      return
    }
    if (type === 'PERCENTAGE') {
      this.finalPriceValue.set(Math.max(price * (1 - value / 100), 0))
      return
    }
    this.finalPriceValue.set(Math.max(price - value, 0))
  }

  private endDateAfterStartDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const startDate = control.get('startDate')?.value
      const endDate = control.get('endDate')?.value

      if (!startDate || !endDate) {
        return null
      }

      const start = new Date(startDate)
      const end = new Date(endDate)

      if (end <= start) {
        return { endDateAfterStart: true }
      }

      return null
    }
  }

  private toDateInputValue(value: string): string {
    const date = new Date(value)
    return date.toISOString().split('T')[0]
  }

  public onSubmit(): void {
    if (this.form.invalid || !this.product) {
      this.form.markAllAsTouched()
      return
    }

    const payload: ApplyDiscountPayload = {
      discountType: this.form.value.discountType,
      discountValue: Number(this.form.value.discountValue),
      startDate: this.form.value.startDate || null,
      endDate: this.form.value.endDate || null,
      isActive: this.form.value.isActive ?? true,
    }

    this.errorMessage = null
    this.isLoading = true

    this._productsManagementService
      .applyDiscount(this.product.id, payload)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.isLoading = false
          this._activeModal.close('discount-applied')
        },
        error: (error) => {
          this.isLoading = false
          this.errorMessage =
            error?.error?.message?.es ||
            error?.error?.message ||
            'No se pudo aplicar el descuento.'
        },
      })
  }

  public removeDiscount(): void {
    if (!this.product) return

    this.errorMessage = null
    this.isLoading = true

    this._productsManagementService
      .removeDiscount(this.product.id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.isLoading = false
          this._activeModal.close('discount-removed')
        },
        error: (error) => {
          this.isLoading = false
          this.errorMessage =
            error?.error?.message?.es ||
            error?.error?.message ||
            'No se pudo remover el descuento.'
        },
      })
  }

  public closeModal(): void {
    this._activeModal.dismiss()
  }
}
