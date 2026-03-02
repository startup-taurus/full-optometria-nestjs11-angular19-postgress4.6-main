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
  public selectedProducts: Product[] = []
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
          const currentSelection = this.formGroup.get('productIds')?.value || []
          this.onProductsSelected(currentSelection)
          this.productsLoading = false
        },
        error: (error: any) => {
          this.productsLoading = false
        },
      })
  }

  private setupProductSelection(): void {
    this.formGroup
      .get('productIds')
      ?.valueChanges.pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((productIds: string[] | null) => {
        this.onProductsSelected(productIds || [])
      })
  }

  private onProductsSelected(productIds: string[]): void {
    const ids = Array.isArray(productIds) ? productIds : []
    this.selectedProducts = this.products.filter((product) =>
      ids.includes(product.id)
    )

    const productNames = this.selectedProducts.map((product) => product.name)
    const productBrands = Array.from(
      new Set(
        this.selectedProducts
          .map((product) => product.brand)
          .filter((brand) => !!brand)
      )
    )

    this.formGroup.patchValue(
      {
        frameBrand: productBrands.join(', '),
        frameModel: productNames.join(', '),
      },
      { emitEvent: false }
    )
  }

  public getProductDisplayName(product: Product): string {
    return `${product.code} - ${product.name}`
  }

  public getProductDataSectionLabel(): string {
    return this.selectedProducts.length > 1
      ? 'LABORATORY_ORDERS.LABELS.PRODUCTS_DATA_SECTION'
      : 'LABORATORY_ORDERS.LABELS.PRODUCT_DATA_SECTION'
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
