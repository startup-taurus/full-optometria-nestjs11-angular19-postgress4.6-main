import { Injectable, computed, signal } from '@angular/core'
import {
  CartBranchGroup,
  CartItem,
  PublicProduct,
} from '@core/interfaces/api/public-product.interface'

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly storageKey = 'public_catalog_cart_v1'
  private readonly cartItems = signal<CartItem[]>(this.loadCartFromStorage())

  readonly items = this.cartItems.asReadonly()
  readonly totalItems = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.quantity, 0)
  )
  readonly totalAmount = computed(() =>
    this.cartItems().reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    )
  )
  readonly isEmpty = computed(() => this.cartItems().length === 0)
  readonly groupedByBranch = computed<CartBranchGroup[]>(() => {
    const grouped = new Map<string, CartBranchGroup>()

    for (const item of this.cartItems()) {
      const current = grouped.get(item.branchId)
      if (!current) {
        grouped.set(item.branchId, {
          branchId: item.branchId,
          branchName: item.branchName,
          branchPhone: item.branchPhone,
          items: [item],
          totalAmount: item.unitPrice * item.quantity,
          totalItems: item.quantity,
        })
        continue
      }

      current.items.push(item)
      current.totalAmount += item.unitPrice * item.quantity
      current.totalItems += item.quantity
    }

    return Array.from(grouped.values())
  })

  addProduct(product: PublicProduct, imageUrl: string, quantity = 1): void {
    if (quantity <= 0) return

    const branchId = product.branch?.id || 'sin-sucursal'
    const branchName =
      product.branch?.name || product.branchName || 'Sin sucursal'
    const branchPhone =
      product.branch?.phone || product.createdByUser?.mobilePhone || ''

    const item: CartItem = {
      productId: product.id,
      name: product.name,
      brand: product.brand,
      imageUrl,
      branchId,
      branchName,
      branchPhone,
      unitPrice: this.resolvePrice(product),
      quantity,
    }

    this.cartItems.update((items) => {
      const index = items.findIndex(
        (current) =>
          current.productId === item.productId &&
          current.branchId === item.branchId
      )

      if (index === -1) {
        const next = [...items, item]
        this.persist(next)
        return next
      }

      const next = items.map((current, currentIndex) =>
        currentIndex === index
          ? {
              ...current,
              quantity: current.quantity + quantity,
              unitPrice: item.unitPrice,
              branchPhone: item.branchPhone || current.branchPhone,
            }
          : current
      )
      this.persist(next)
      return next
    })
  }

  increaseQuantity(productId: string, branchId: string): void {
    this.setQuantity(
      productId,
      branchId,
      this.getItemQuantity(productId, branchId) + 1
    )
  }

  decreaseQuantity(productId: string, branchId: string): void {
    this.setQuantity(
      productId,
      branchId,
      this.getItemQuantity(productId, branchId) - 1
    )
  }

  setQuantity(productId: string, branchId: string, quantity: number): void {
    this.cartItems.update((items) => {
      const next = items
        .map((item) => {
          if (item.productId !== productId || item.branchId !== branchId) {
            return item
          }

          return {
            ...item,
            quantity,
          }
        })
        .filter((item) => item.quantity > 0)

      this.persist(next)
      return next
    })
  }

  removeItem(productId: string, branchId: string): void {
    this.cartItems.update((items) => {
      const next = items.filter(
        (item) => !(item.productId === productId && item.branchId === branchId)
      )
      this.persist(next)
      return next
    })
  }

  clearCart(): void {
    this.cartItems.set([])
    this.persist([])
  }

  private getItemQuantity(productId: string, branchId: string): number {
    const item = this.cartItems().find(
      (current) =>
        current.productId === productId && current.branchId === branchId
    )

    return item?.quantity ?? 0
  }

  private resolvePrice(product: PublicProduct): number {
    const discountPrice = product.discount?.finalPrice
    if (product.hasActiveDiscount && discountPrice !== undefined) {
      return Number(discountPrice)
    }

    return Number(product.unitPrice)
  }

  private loadCartFromStorage(): CartItem[] {
    const raw = localStorage.getItem(this.storageKey)
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []

      return parsed
        .filter((item) => {
          return (
            typeof item?.productId === 'string' &&
            typeof item?.branchId === 'string' &&
            typeof item?.name === 'string' &&
            typeof item?.unitPrice === 'number' &&
            typeof item?.quantity === 'number'
          )
        })
        .map((item) => ({
          ...item,
          branchPhone:
            typeof item?.branchPhone === 'string'
              ? item.branchPhone.replace(/\s+/g, '').trim()
              : '',
        }))
    } catch {
      return []
    }
  }

  private persist(items: CartItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items))
  }
}
