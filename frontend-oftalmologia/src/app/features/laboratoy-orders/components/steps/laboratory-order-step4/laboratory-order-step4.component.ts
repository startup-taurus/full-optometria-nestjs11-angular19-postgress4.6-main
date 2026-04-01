import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormGroup } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgSelectModule } from '@ng-select/ng-select'
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs'
import { ProductService } from '@core/services/api/product.service'
import { Product } from '@core/interfaces/api/inventory.interface'
import { LaboratoryOrderLineItem } from '@core/interfaces/api/laboratory-order.interface'

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
  public lineItems: LaboratoryOrderLineItem[] = []
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

    const currentLineItems = this.getCurrentLineItemsByProductId()
    this.lineItems = this.selectedProducts.map((product) => {
      const currentQuantity = currentLineItems.get(product.id)
      return {
        productId: product.id,
        quantity:
          typeof currentQuantity === 'number' && currentQuantity > 0
            ? currentQuantity
            : 1,
      }
    })

    const productNames = this.selectedProducts.map((product) =>
      this.getProductDisplayName(product)
    )
    const productBrands = Array.from(
      new Set(
        this.selectedProducts
          .map((product) => product.brand)
          .filter((brand) => !!brand)
      )
    )

    this.formGroup.patchValue(
      {
        lineItems: this.lineItems,
        frameBrand: productBrands.join(', '),
        frameModel: productNames.join(', '),
      },
      { emitEvent: false }
    )
  }

  private getCurrentLineItemsByProductId(): Map<string, number> {
    const current = this.formGroup.get('lineItems')?.value
    const map = new Map<string, number>()

    if (!Array.isArray(current)) {
      return map
    }

    current.forEach((line: any) => {
      if (
        line &&
        typeof line.productId === 'string' &&
        Number.isFinite(Number(line.quantity))
      ) {
        map.set(line.productId, Math.max(1, Number(line.quantity)))
      }
    })

    return map
  }

  public getProductStock(productId: string): number {
    const product = this.products.find((item) => item.id === productId)
    return Number(product?.quantity || 0)
  }

  public getLineItemProduct(productId: string): Product | undefined {
    return this.products.find((item) => item.id === productId)
  }

  public getLineItemDisplayName(productId: string): string {
    const product = this.getLineItemProduct(productId)
    return product ? this.getProductDisplayName(product) : productId
  }

  public onQuantityChange(productId: string, value: string): void {
    const parsed = Number(value)
    const normalized = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1

    this.lineItems = this.lineItems.map((line) =>
      line.productId === productId ? { ...line, quantity: normalized } : line
    )

    this.formGroup.patchValue(
      {
        lineItems: this.lineItems,
      },
      { emitEvent: false }
    )
  }

  public incrementQuantity(productId: string): void {
    const current = this.getLineItemQuantity(productId)
    const stock = this.getProductStock(productId)
    if (stock > 0 && current >= stock) {
      return
    }

    this.onQuantityChange(productId, String(current + 1))
  }

  public decrementQuantity(productId: string): void {
    const current = this.getLineItemQuantity(productId)
    if (current <= 1) {
      return
    }

    this.onQuantityChange(productId, String(current - 1))
  }

  public getLineItemQuantity(productId: string): number {
    const lineItem = this.lineItems.find((item) => item.productId === productId)
    return Number(lineItem?.quantity || 1)
  }

  public canIncrementQuantity(productId: string): boolean {
    const stock = this.getProductStock(productId)
    return stock <= 0 || this.getLineItemQuantity(productId) < stock
  }

  public canDecrementQuantity(productId: string): boolean {
    return this.getLineItemQuantity(productId) > 1
  }

  public removeLineItem(productId: string): void {
    const nextLineItems = this.lineItems.filter((line) => line.productId !== productId)
    const nextProductIds = nextLineItems.map((line) => line.productId)

    this.formGroup.patchValue({
      productIds: nextProductIds,
      lineItems: nextLineItems,
    })
  }

  public isLineItemOverStock(lineItem: LaboratoryOrderLineItem): boolean {
    return lineItem.quantity > this.getProductStock(lineItem.productId)
  }

  public hasOverStockLineItems(): boolean {
    return this.lineItems.some((lineItem) => this.isLineItemOverStock(lineItem))
  }

  public getProductDisplayName(product: Product): string {
    return `${product.code} - ${product.name}`
  }

  public getProductDataSectionLabel(): string {
    return this.selectedProducts.length > 1
      ? 'LABORATORY_ORDERS.LABELS.PRODUCTS_DATA_SECTION'
      : 'LABORATORY_ORDERS.LABELS.PRODUCT_DATA_SECTION'
  }

  public getSelectedProductRows(): Array<{
    code: string
    name: string
    brand: string
    stock: number | null
    quantity: number
  }> {
    return this.lineItems.map((lineItem) => {
      const product = this.getLineItemProduct(lineItem.productId)

      return {
        code: product?.code || '-',
        name: product?.name || lineItem.productId,
        brand: product?.brand || '-',
        stock:
          typeof product?.quantity === 'number' ? product.quantity : null,
        quantity: lineItem.quantity,
      }
    })
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
