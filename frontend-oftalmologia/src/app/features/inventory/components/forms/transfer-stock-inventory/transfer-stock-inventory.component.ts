import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { Product } from '@core/interfaces/api/inventory.interface'
import { Branch } from '@core/interfaces/api/branch.interface'
import { ProductService } from '@core/services/api/product.service'
import { BranchService } from '@core/services/api/branch.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import Swal from 'sweetalert2'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { NgSelectModule } from '@ng-select/ng-select'
import { TranslateModule } from '@ngx-translate/core'
import { TranslateService } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'

interface TransferStockModalData {
  selectedRow?: Product
}

@Component({
  selector: 'transfer-stock-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule],
  templateUrl: './transfer-stock-inventory.component.html',
  styleUrl: './transfer-stock-inventory.component.scss',
})
export class TransferStockInventoryComponent implements OnInit, OnDestroy {
  public form!: FormGroup
  public isLoading = false
  public product?: Product
  public availableBranches: Branch[] = []
  public errorMessage: string | null = null

  private unsubscribe$ = new Subject<void>()

  private _activeModal = inject(NgbActiveModal)
  private _fb = inject(FormBuilder)
  private _productService = inject(ProductService)
  private _branchService = inject(BranchService)
  private _translate = inject(TranslateService)
  private _bsModalService = inject(
    BootstrapModalService<TransferStockModalData>
  )

  ngOnInit(): void {
    this.initializeForm()
    this.loadModalData()
    this.loadBranches()
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  private initializeForm(): void {
    this.form = this._fb.group({
      destinationBranchId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      note: ['', Validators.maxLength(500)],
    })
  }

  private loadModalData(): void {
    this._bsModalService
      .getDataIssued()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: TransferStockModalData) => {
        if (data?.selectedRow) {
          this.product = data.selectedRow
          this.form.patchValue({ quantity: 1 })
        }
      })
  }

  private loadBranches(): void {
    this._branchService
      .getAllBranchesForSelector()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((branches) => {
        const currentBranchId = this.product?.branchId
        this.availableBranches = branches.filter(
          (branch) => branch.id !== currentBranchId
        )
      })
  }

  public onSubmit(): void {
    if (!this.product || this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched()
      return
    }

    const quantity = Number(this.form.value.quantity)
    if (quantity > this.product.quantity) {
      Swal.fire({
        icon: 'error',
        title: this._translate.instant(
          'INVENTORY.TRANSFER_STOCK.INSUFFICIENT_STOCK_TITLE'
        ),
        text: this._translate.instant(
          'INVENTORY.TRANSFER_STOCK.INSUFFICIENT_STOCK_TEXT',
          {
            quantity,
            stock: this.product.quantity,
          }
        ),
        confirmButtonText: this._translate.instant('COMMON.ACCEPT'),
        confirmButtonColor: '#d33',
      })
      return
    }

    this.errorMessage = null
    this.isLoading = true

    this._productService
      .transferStock(this.product.id, {
        destinationBranchId: this.form.value.destinationBranchId,
        quantity,
        note: this.form.value.note,
      })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.isLoading = false
          this._activeModal.close('transferred')
        },
        error: (error) => {
          this.isLoading = false
          this.errorMessage =
            error?.error?.message?.es ||
            this._translate.instant(
              'INVENTORY.TRANSFER_STOCK.ERROR_MESSAGE'
            )
        },
      })
  }

  public closeModal(): void {
    this._activeModal.dismiss()
  }
}
