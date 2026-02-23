import { CommonModule } from '@angular/common'
import { Component, inject, OnInit, OnDestroy } from '@angular/core'
import { Product } from '@core/interfaces/api/inventory.interface'
import { ModalWithAction } from '@core/interfaces/ui/bootstrap-modal.interface'
import { ProductService } from '@core/services/api/product.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'view-inventory',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './view-inventory.component.html',
  styleUrl: './view-inventory.component.scss',
})
export class ViewInventoryComponent implements OnInit, OnDestroy {
  public product?: Product
  public showImageModal = false
  public selectedImageUrl = ''

  private unsubscribe$ = new Subject<void>()

  private _activeModal = inject(NgbActiveModal)
  private _bsModalService = inject(
    BootstrapModalService<ModalWithAction<Product>>
  )
  private _translateService = inject(TranslateService)
  private _productService = inject(ProductService)

  ngOnInit(): void {
    this.loadModalData()
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  private loadModalData(): void {
    this._bsModalService
      .getDataIssued()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: ModalWithAction<Product>) => {
        if (data && data.selectedRow) {
          this.product = data.selectedRow
        }
      })
  }

  public onClose(): void {
    this._activeModal.dismiss()
  }

  public getSupplierName(): string {
    if (!this.product?.defaultSupplier?.name) {
      return this._translateService.instant('COMMON.NOT_SPECIFIED')
    }

    return this.product.defaultSupplier.name
  }

  public getProductImageUrl(): string {
    if (this.product?.images && this.product.images.length > 0) {
      const coverImage = this.product.images.find((img) => img.isCover)
      const imageToShow = coverImage || this.product.images[0]
      return this._productService.getImageUrl(imageToShow.path)
    }
    return 'assets/images/lentes.png'
  }

  public getDescription(): string {
    return (
      this.product?.description ||
      this._translateService.instant('COMMON.NOT_SPECIFIED')
    )
  }

  public openImageModal(): void {
    this.selectedImageUrl = this.getProductImageUrl()
    this.showImageModal = true
  }

  public closeImageModal(): void {
    this.showImageModal = false
    this.selectedImageUrl = ''
  }
}
