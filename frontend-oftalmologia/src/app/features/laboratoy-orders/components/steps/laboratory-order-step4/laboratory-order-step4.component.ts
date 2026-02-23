import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormGroup } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgSelectModule } from '@ng-select/ng-select'
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs'
import { ProductService } from '@core/services/api/product.service'
import { Product } from '@core/interfaces/api/inventory.interface'

@Component({
  selector: 'app-laboratory-order-step4',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule],
  templateUrl: './laboratory-order-step4.component.html',
  styleUrls: ['./laboratory-order-step4.component.scss'],
})
export class LaboratoryOrderStep4Component implements OnInit, OnDestroy {
  @Input() formGroup!: FormGroup

  private destroy$ = new Subject<void>()
  private _productService = inject(ProductService)
  private _translateService = inject(TranslateService)

  public products: Product[] = []
  public selectedProduct: Product | null = null
  public productsLoading = false
  public selectedFrameType: string = ''

  public frameTypes = [
    {
      value: '3_piezas_al_aire',
      label: this._translateService.instant(
        'LABORATORY_ORDERS.FIELDS.FRAME_TYPES.3_PIEZAS_AL_AIRE'
      ),
    },
    {
      value: 'ranurado_semiaire',
      label: this._translateService.instant(
        'LABORATORY_ORDERS.FIELDS.FRAME_TYPES.RANURADO_SEMIAIRE'
      ),
    },
    {
      value: 'completo',
      label: this._translateService.instant(
        'LABORATORY_ORDERS.FIELDS.FRAME_TYPES.COMPLETO'
      ),
    },
  ]

  ngOnInit(): void {
    this.loadProducts()
    this.setupProductSelection()
    this.loadInitialFrameType()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private loadInitialFrameType(): void {
    const frameTypeValue = this.formGroup.get('frameType')?.value
    if (frameTypeValue) {
      if (Array.isArray(frameTypeValue)) {
        this.selectedFrameType = frameTypeValue[0] || ''
      } else if (typeof frameTypeValue === 'string') {
        this.selectedFrameType = frameTypeValue.split(',')[0] || frameTypeValue
      } else {
        this.selectedFrameType = frameTypeValue
      }
    }
  }

  private loadProducts(): void {
    this.productsLoading = true

    this._productService
      .findProducts({ isActive: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const items =
            response?.data?.data?.result || response?.data?.result || []
          this.products = items
          this.productsLoading = false
        },
        error: (error: any) => {
          this.productsLoading = false
        },
      })
  }

  private setupProductSelection(): void {
    this.formGroup
      .get('productId')
      ?.valueChanges.pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((productId) => {
        if (productId) {
          this.onProductSelected(productId)
        }
      })
  }

  private onProductSelected(productId: string): void {
    const product = this.products.find((p) => p.id === productId)

    if (product) {
      this.selectedProduct = product

      this.formGroup.patchValue({
        frameBrand: product.brand || '',
        frameModel: product.name || '',
      })
    }
  }

  public getProductDisplayName(product: Product): string {
    return `${product.code} - ${product.name}`
  }

  public onFrameTypeToggle(value: string): void {
    if (this.selectedFrameType === value) {
      this.selectedFrameType = ''
      this.formGroup.patchValue({
        frameType: '',
      })
    } else {
      this.selectedFrameType = value
      this.formGroup.patchValue({
        frameType: value,
      })
    }
  }

  public isFrameTypeSelected(value: string): boolean {
    return this.selectedFrameType === value
  }
}
