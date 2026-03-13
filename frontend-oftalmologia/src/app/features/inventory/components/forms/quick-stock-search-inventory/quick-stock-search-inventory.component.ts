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
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'

export interface QuickStockSearchResult {
  action: 'stock' | 'create'
  code: string
  product?: Product
}

@Component({
  selector: 'quick-stock-search-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgbModule],
  templateUrl: './quick-stock-search-inventory.component.html',
  styleUrl: './quick-stock-search-inventory.component.scss',
})
export class QuickStockSearchInventoryComponent implements OnInit, OnDestroy {
  public form!: FormGroup
  public isSearching = false
  public hasSearched = false
  public productFound: Product | null = null
  public searchErrorMessage: string | null = null
  public cameraErrorMessage: string | null = null
  public isScannerRunning = false
  public readonly readerElementId = `inventory-code-reader-${Math.random().toString(36).slice(2)}`

  private unsubscribe$ = new Subject<void>()
  private scannerInstance: any | null = null

  private _activeModal = inject(NgbActiveModal)
  private _fb = inject(FormBuilder)
  private _productService = inject(ProductService)

  ngOnInit(): void {
    this.form = this._fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
    this.stopScanner()
  }

  public searchProduct(): void {
    if (this.form.invalid || this.isSearching) {
      this.form.markAllAsTouched()
      return
    }

    const code = (this.form.get('code')?.value || '').trim()
    if (!code) {
      return
    }

    this.isSearching = true
    this.hasSearched = false
    this.productFound = null
    this.searchErrorMessage = null

    this._productService
      .findProductByCode(code)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (product) => {
          this.productFound = product
          this.hasSearched = true
          this.isSearching = false
        },
        error: () => {
          this.productFound = null
          this.hasSearched = true
          this.isSearching = false
          this.searchErrorMessage = 'INVENTORY.QUICK_STOCK.NOT_FOUND'
        },
      })
  }

  public useFoundProduct(): void {
    if (!this.productFound) {
      return
    }

    const code = (this.form.get('code')?.value || '').trim()
    const result: QuickStockSearchResult = {
      action: 'stock',
      code,
      product: this.productFound,
    }
    this._activeModal.close(result)
  }

  public createProductWithCode(): void {
    const code = (this.form.get('code')?.value || '').trim()
    if (!code) {
      this.form.markAllAsTouched()
      return
    }

    const result: QuickStockSearchResult = {
      action: 'create',
      code,
    }

    this._activeModal.close(result)
  }

  public async toggleScanner(): Promise<void> {
    if (this.isScannerRunning) {
      await this.stopScanner()
      return
    }

    await this.startScanner()
  }

  private async startScanner(): Promise<void> {
    this.cameraErrorMessage = null

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')

      this.scannerInstance = new Html5Qrcode(this.readerElementId)
      await this.scannerInstance.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 140 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
          ],
        },
        (decodedText: string) => {
          const code = (decodedText || '').trim()
          if (!code) {
            return
          }

          this.form.patchValue({ code })
          this.stopScanner()
          this.searchProduct()
        },
        () => {},
      )

      this.isScannerRunning = true
    } catch {
      this.cameraErrorMessage = 'INVENTORY.QUICK_STOCK.CAMERA_ERROR'
      await this.stopScanner()
    }
  }

  private async stopScanner(): Promise<void> {
    if (!this.scannerInstance) {
      this.isScannerRunning = false
      return
    }

    try {
      if (this.isScannerRunning) {
        await this.scannerInstance.stop()
      }
      await this.scannerInstance.clear()
    } catch {
      // no-op
    } finally {
      this.scannerInstance = null
      this.isScannerRunning = false
    }
  }

  public closeModal(): void {
    this._activeModal.dismiss()
  }
}
