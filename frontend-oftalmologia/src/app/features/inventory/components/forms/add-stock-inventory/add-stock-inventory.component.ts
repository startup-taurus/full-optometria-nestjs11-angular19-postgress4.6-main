import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { Product } from '@core/interfaces/api/inventory.interface'
import { ProductService } from '@core/services/api/product.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'
import Swal from 'sweetalert2'

interface AddStockModalData {
  selectedRow?: Product
}

@Component({
  selector: 'add-stock-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './add-stock-inventory.component.html',
  styleUrl: './add-stock-inventory.component.scss',
})
export class AddStockInventoryComponent implements OnInit, OnDestroy {
  public form!: FormGroup
  public isLoading = false
  public product?: Product
  public errorMessage: string | null = null

  private unsubscribe$ = new Subject<void>()

  private _activeModal = inject(NgbActiveModal)
  private _fb = inject(FormBuilder)
  private _productService = inject(ProductService)
  private _bsModalService = inject(BootstrapModalService<AddStockModalData>)

  ngOnInit(): void {
    this.initializeForm()
    this.loadModalData()
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  private initializeForm(): void {
    this.form = this._fb.group({
      quantityToAdd: [
        1,
        [Validators.required, Validators.min(1), Validators.max(99999)],
      ],
    })
  }

  private loadModalData(): void {
    this._bsModalService
      .getDataIssued()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: AddStockModalData) => {
        if (data?.selectedRow) {
          this.product = data.selectedRow
        }
      })
  }

  public get newTotal(): number {
    const current = this.product?.quantity ?? 0
    const toAdd = Number(this.form.get('quantityToAdd')?.value) || 0
    return current + (toAdd > 0 ? toAdd : 0)
  }

  public increment(): void {
    const ctrl = this.form.get('quantityToAdd')!
    const current = Number(ctrl.value) || 0
    ctrl.setValue(current + 1)
  }

  public decrement(): void {
    const ctrl = this.form.get('quantityToAdd')!
    const current = Number(ctrl.value) || 0
    if (current > 1) ctrl.setValue(current - 1)
  }

  public onSubmit(): void {
    if (this.form.invalid || !this.product) return

    const quantityToAdd = Number(this.form.value.quantityToAdd)
    const currentQuantity = this.product.quantity ?? 0
    const newQuantity = currentQuantity + quantityToAdd

    this.errorMessage = null
    this.isLoading = true

    this._productService
      .updateProduct(this.product.id, { quantity: newQuantity })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.isLoading = false
          this._activeModal.close('stock-added')
        },
        error: (error) => {
          this.isLoading = false
          this.errorMessage =
            error?.error?.message?.es ||
            error?.error?.message ||
            'Ocurrió un error al agregar el stock.'
        },
      })
  }

  public closeModal(): void {
    this._activeModal.dismiss()
  }
}
