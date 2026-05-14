import { Component, HostListener, OnInit, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, RouterModule, ActivatedRoute } from '@angular/router'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { PublicCatalogService } from '@core/services/api/public-catalog.service'
import { AuthenticationService } from '@core/services/api/auth.service'
import {
  CartBranchGroup,
  PublicProduct,
  PublicProductFilters,
  PublicProductQuery,
} from '@core/interfaces/api/public-product.interface'
import { PublicCatalogPdfProduct } from '@core/interfaces/ui/public-catalog-pdf.interface'
import { CartService } from '@core/services/ui/cart.service'
import { DefaultZgamesComponent } from '../default-zgames/default-zgames.component'
import Swal from 'sweetalert2'
import { firstValueFrom } from 'rxjs'
import { PublicCatalogPdfService } from '@core/services/ui/public-catalog-pdf.service'

interface WhatsAppBranchTarget {
  branchName: string
  phone: string
  link: string
}

@Component({
  selector: 'app-public-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DefaultZgamesComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './public-catalog.component.html',
  styleUrls: ['./public-catalog.component.scss'],
})
export class PublicCatalogComponent implements OnInit {
  private readonly catalogService = inject(PublicCatalogService)
  private readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)
  private readonly authService = inject(AuthenticationService)
  private readonly cartService = inject(CartService)
  private readonly publicCatalogPdfService = inject(PublicCatalogPdfService)

  companyName = signal<string>('')
  isValidCompany = signal<boolean>(false)
  isCheckingCompany = signal<boolean>(true)
  backendError = signal(false)

  products = signal<PublicProduct[]>([])
  filters = signal<PublicProductFilters>({
    categories: [],
    subcategories: [],
    brands: [],
    branches: [],
  })

  loading = signal(false)
  totalCount = signal(0)
  totalPages = signal(0)
  currentPage = signal(1)

  showImageModal = false
  selectedImageUrl = ''
  selectedProductName = ''
  selectedProductCode = ''

  showProductModal = false
  selectedProduct: PublicProduct | null = null
  selectedProductImageUrl = ''
  selectedProductQuantity = 1
  isCartOpen = false
  generatingCatalogPdf = false

  searchName = ''
  searchDescription = ''
  selectedBrand = ''
  selectedCategoryId = ''
  selectedBranchId = ''
  showOnlyAvailable = false
  minPrice: number | undefined = undefined
  maxPrice: number | undefined = undefined
  sortBy: 'views' | 'price-asc' | 'price-desc' | 'newest' = 'newest'

  isFiltersDrawerOpen = false
  private pendingProductIdFromUrl: string | null = null
  private hasProcessedInitialProductFromUrl = false

  get cartCount(): number {
    return this.cartService.totalItems()
  }

  get cartTotal(): number {
    return this.cartService.totalAmount()
  }

  get cartGroups(): CartBranchGroup[] {
    return this.cartService.groupedByBranch()
  }

  get hasCartItems(): boolean {
    return !this.cartService.isEmpty()
  }

  get filterToggleIcon(): string {
    return this.isFiltersDrawerOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'
  }

  get selectedCategoryName(): string {
    if (!this.selectedCategoryId) return ''

    const category = this.filters().categories.find(
      (item) => item.id === this.selectedCategoryId
    )
    return category?.name ?? ''
  }

  get hasPriceFilter(): boolean {
    return this.minPrice !== undefined || this.maxPrice !== undefined
  }

  get selectedBranchName(): string {
    if (!this.selectedBranchId) return ''
    return (
      this.filters().branches?.find((b) => b.id === this.selectedBranchId)
        ?.name ?? ''
    )
  }

  private getSelectedCategoryIds(): string[] {
    if (!this.selectedCategoryId) return []

    const selectedCategory = this.filters().categories.find(
      (item) => item.id === this.selectedCategoryId
    )

    if (!selectedCategory) {
      return [this.selectedCategoryId]
    }

    if (selectedCategory.ids && selectedCategory.ids.length > 0) {
      return selectedCategory.ids
    }

    return [selectedCategory.id]
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const companyParam = params.get('companyName')
      if (companyParam) {
        this.companyName.set(companyParam)
        localStorage.setItem('catalog_company_name', companyParam)
        this.hasProcessedInitialProductFromUrl = false
        this.validateCompanyAndLoad()
      } else {
        const savedCompany = localStorage.getItem('catalog_company_name')
        if (savedCompany) {
          this.companyName.set(savedCompany)
          this.hasProcessedInitialProductFromUrl = false
          this.validateCompanyAndLoad()
        } else {
          this.isValidCompany.set(false)
          this.isCheckingCompany.set(false)
        }
      }
    })

    this.route.queryParamMap.subscribe((params) => {
      this.pendingProductIdFromUrl = params.get('productId')
    })
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.isMobileViewport()) {
      this.isFiltersDrawerOpen = false
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    if (this.isCartOpen) {
      this.closeCart()
      return
    }

    if (this.showImageModal) {
      this.closeImageModal()
      return
    }

    if (this.showProductModal) {
      this.closeProductModal()
      return
    }

    if (this.isFiltersDrawerOpen) {
      this.closeFiltersDrawer()
    }
  }

  @HostListener('document:keydown.arrowleft', ['$event'])
  onArrowLeftPressed(event: KeyboardEvent): void {
    if (!this.shouldHandleGalleryKeyboardNavigation(event)) {
      return
    }

    event.preventDefault()
    this.previousProductImage()
  }

  @HostListener('document:keydown.arrowright', ['$event'])
  onArrowRightPressed(event: KeyboardEvent): void {
    if (!this.shouldHandleGalleryKeyboardNavigation(event)) {
      return
    }

    event.preventDefault()
    this.nextProductImage()
  }

  isMobileViewport(): boolean {
    return window.innerWidth < 992
  }
  private validateCompanyAndLoad(): void {
    const companyNameValue = this.companyName()

    if (!companyNameValue) {
      this.isValidCompany.set(false)
      this.isCheckingCompany.set(false)
      return
    }

    this.catalogService.validateCompany(companyNameValue).subscribe({
      next: (response) => {
        if (response.isValid) {
          this.isValidCompany.set(true)
          localStorage.setItem('catalog_company_name', companyNameValue)
          this.loadFilters()
          this.loadProducts()
        } else {
          this.isValidCompany.set(false)
          localStorage.removeItem('catalog_company_name')
        }
        this.isCheckingCompany.set(false)
      },
      error: () => {
        this.isValidCompany.set(false)
        this.isCheckingCompany.set(false)
        localStorage.removeItem('catalog_company_name')
      },
    })
  }

  loadFilters(): void {
    this.catalogService.getFilters(this.companyName()).subscribe({
      next: (filters) => {
        if (filters && filters.categories && filters.subcategories) {
          this.filters.set(filters)
          this.backendError.set(false)
        } else {
          this.filters.set({
            categories: [],
            subcategories: [],
            brands: [],
            branches: [],
          })
        }
      },
      error: () => {
        this.backendError.set(true)
      },
    })
  }

  loadProducts(): void {
    this.loading.set(true)

    const companyName = this.companyName()
    if (!companyName) {
      this.loading.set(false)
      this.products.set([])
      return
    }

    const query: PublicProductQuery = {
      companyName,
      page: this.currentPage(),
      limit: 12,
    }

    this.normalizePriceRange()

    const searchTerms: string[] = []
    if (this.searchName) searchTerms.push(this.searchName)
    if (this.searchDescription) searchTerms.push(this.searchDescription)
    if (searchTerms.length > 0) {
      query.search = searchTerms.join(' ')
    }

    if (this.selectedBrand) query.brand = this.selectedBrand
    if (this.minPrice !== undefined) query.minPrice = this.minPrice
    if (this.maxPrice !== undefined) query.maxPrice = this.maxPrice
    if (this.sortBy) query.sortBy = this.sortBy

    const selectedCategoryIds = this.getSelectedCategoryIds()
    if (selectedCategoryIds.length === 1) {
      query.categoryId = selectedCategoryIds[0]
    } else if (selectedCategoryIds.length > 1) {
      query.categoryIds = selectedCategoryIds
    }

    if (this.selectedBranchId) query.branchId = this.selectedBranchId

    this.catalogService.getProducts(query).subscribe({
      next: (response) => {
        if (response && response.items && Array.isArray(response.items)) {
          const filteredItems = response.items.filter(
            (product) => product.branch?.id !== undefined
          )
          this.products.set(filteredItems)
          this.totalCount.set(response.totalCount || 0)
          this.totalPages.set(response.totalPages || 0)
          this.backendError.set(false)
        } else {
          this.products.set([])
          this.totalCount.set(0)
          this.totalPages.set(0)
        }

        this.loading.set(false)

        if (
          !this.hasProcessedInitialProductFromUrl &&
          this.pendingProductIdFromUrl
        ) {
          this.openProductFromUrl(this.pendingProductIdFromUrl)
        }

        window.scrollTo({ top: 0, behavior: 'smooth' })
      },
      error: (error) => {
        this.loading.set(false)
        this.backendError.set(true)
        this.products.set([])
        this.totalCount.set(0)
        this.totalPages.set(0)
      },
    })
  }

  onSearch(): void {
    this.currentPage.set(1)
    this.loadProducts()
    this.closeFiltersDrawer()
  }

  onFilterChange(): void {
    this.currentPage.set(1)
    this.loadProducts()
  }

  onCategoryChange(): void {
    this.onFilterChange()
  }

  onBrandChange(): void {
    this.onFilterChange()
  }

  onAvailabilityChange(): void {
    this.onFilterChange()
  }

  clearCategoryFilter(): void {
    this.selectedCategoryId = ''
    this.onFilterChange()
  }

  clearBrandFilter(): void {
    this.selectedBrand = ''
    this.onFilterChange()
  }

  clearBranchFilter(): void {
    this.selectedBranchId = ''
    this.onFilterChange()
  }

  clearAvailabilityFilter(): void {
    this.showOnlyAvailable = false
    this.onFilterChange()
  }

  clearPriceFilter(): void {
    this.minPrice = undefined
    this.maxPrice = undefined
    this.onFilterChange()
  }

  clearFilters(): void {
    this.searchName = ''
    this.searchDescription = ''
    this.selectedBrand = ''
    this.selectedCategoryId = ''
    this.selectedBranchId = ''
    this.showOnlyAvailable = false
    this.minPrice = undefined
    this.maxPrice = undefined
    this.sortBy = 'newest'
    this.currentPage.set(1)
    this.loadProducts()
    this.closeFiltersDrawer()
  }

  goToPage(page: number): void {
    this.currentPage.set(page)
    this.loadProducts()
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1)
      this.loadProducts()
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1)
      this.loadProducts()
    }
  }

  private normalizePriceRange(): void {
    if (
      this.minPrice !== undefined &&
      this.maxPrice !== undefined &&
      this.minPrice > this.maxPrice
    ) {
      const minPrice = this.maxPrice
      this.maxPrice = this.minPrice
      this.minPrice = minPrice
    }
  }

  getImageUrl(product: PublicProduct): string {
    if (!product.images || product.images.length === 0) {
      return 'assets/images/lentes.png'
    }

    const coverImage = product.images.find((img) => img.isCover)
    const imagePath = coverImage?.path || product.images[0]?.path

    if (!imagePath) {
      return 'assets/images/lentes.png'
    }

    return this.catalogService.getImageUrl(imagePath)
  }

  openProductModal(product: PublicProduct): void {
    this.selectedProductQuantity = 1
    this.applySelectedProduct(product)
    this.updateProductQueryParam(product.id)

    this.catalogService.getProductById(product.id).subscribe({
      next: (updatedProduct) => {
        this.applySelectedProduct(updatedProduct)
      },
      error: () => {
        this.applySelectedProduct(product)
      },
    })
  }

  closeProductModal(): void {
    this.showProductModal = false
    this.selectedProduct = null
    this.selectedProductImageUrl = ''
    this.selectedProductQuantity = 1
    this.updateBodyScrollState()
    this.updateProductQueryParam(null)
  }

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen
    this.updateBodyScrollState()
  }

  closeCart(): void {
    this.isCartOpen = false
    this.updateBodyScrollState()
  }

  addToCart(product: PublicProduct, quantity = 1, event?: Event): void {
    event?.stopPropagation()

    const safeQuantity =
      Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1
    this.cartService.addProduct(
      product,
      this.getImageUrl(product),
      safeQuantity
    )

    this.showToast(
      'success',
      'Producto agregado',
      `${product.name} se añadió al carrito.`
    )
  }

  getProductQuantityInCart(product: PublicProduct): number {
    const branchId = product.branch?.id || 'sin-sucursal'
    const item = this.cartService
      .items()
      .find(
        (current) =>
          current.productId === product.id && current.branchId === branchId
      )

    return item?.quantity ?? 0
  }

  increaseCartItem(productId: string, branchId: string): void {
    this.cartService.increaseQuantity(productId, branchId)
  }

  decreaseCartItem(productId: string, branchId: string): void {
    this.cartService.decreaseQuantity(productId, branchId)
  }

  setCartItemQuantity(
    productId: string,
    branchId: string,
    value: string
  ): void {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isFinite(parsed)) {
      return
    }

    this.cartService.setQuantity(productId, branchId, parsed)
  }

  removeCartItem(productId: string, branchId: string): void {
    this.cartService.removeItem(productId, branchId)
  }

  clearCart(): void {
    this.cartService.clearCart()
  }

  async acquireCartByWhatsApp(): Promise<void> {
    const groups = this.cartGroups
    if (!groups.length) {
      return
    }

    const targets: WhatsAppBranchTarget[] = []
    const missingPhones: string[] = []

    for (const group of groups) {
      const branchPhone = this.resolveBranchPhoneForGroup(group)

      if (!branchPhone) {
        missingPhones.push(group.branchName)
        continue
      }

      const message = this.buildBranchMessage(group)
      const link = this.catalogService.generateCartWhatsAppLink(
        branchPhone,
        message
      )

      if (link) {
        targets.push({
          branchName: group.branchName,
          phone: branchPhone,
          link,
        })
      } else {
        missingPhones.push(group.branchName)
      }
    }

    if (!targets.length) {
      this.showToast(
        'warning',
        'No se pudo generar WhatsApp',
        'No hay teléfonos disponibles en las sucursales del carrito.'
      )
      return
    }

    this.closeCart()

    if (targets.length === 1) {
      window.open(targets[0].link, '_blank', 'noopener,noreferrer')
    } else {
      await this.showWhatsAppBranchSelector(targets)
    }

    if (missingPhones.length) {
      this.showToast(
        'info',
        'Algunas sucursales no tienen teléfono',
        `No se pudo enviar para: ${missingPhones.join(', ')}`
      )
      return
    }

    this.showToast(
      'success',
      'WhatsApp abierto',
      targets.length === 1
        ? 'Se abrió el resumen de tu carrito.'
        : 'Selecciona la sucursal desde la lista y abre cada chat manualmente.'
    )
  }

  async exportBranchCatalogPdf(): Promise<void> {
    if (this.generatingCatalogPdf) {
      return
    }

    if (!this.selectedBranchId) {
      this.showToast(
        'warning',
        'Selecciona una sucursal',
        'Para generar el catálogo PDF debes filtrar por una sucursal.'
      )
      return
    }

    const companyName = this.companyName()
    if (!companyName) {
      this.showToast(
        'error',
        'Empresa inválida',
        'No fue posible identificar la empresa del catálogo.'
      )
      return
    }

    this.generatingCatalogPdf = true

    try {
      const products = await this.loadProductsForBranchPdf(
        this.selectedBranchId,
        companyName
      )

      if (!products.length) {
        this.showToast(
          'info',
          'Sin productos para exportar',
          'La sucursal seleccionada no tiene productos activos.'
        )
        return
      }

      const branch = this.resolveBranchInfoForPdf(
        this.selectedBranchId,
        products
      )
      const pdfProducts: PublicCatalogPdfProduct[] = products.map(
        (product) => ({
          name: product.name,
          brand: product.brand,
          description: product.description,
          unitPrice: this.resolveFinalProductPrice(product),
          imageUrl: this.getImageUrl(product),
          imageUrls: product.images?.map((image) =>
            this.catalogService.getImageUrl(image.path)
          ),
          discount:
            product.hasActiveDiscount && product.discount
              ? {
                  type: product.discount.type,
                  value: product.discount.value,
                  finalPrice: product.discount.finalPrice,
                  originalPrice: product.discount.originalPrice,
                }
              : undefined,
        })
      )

      await this.publicCatalogPdfService.downloadCatalog(
        {
          title: 'Catálogo de Productos',
          generatedAt: new Date(),
          branch: {
            id: this.selectedBranchId,
            name: branch.name,
            phone: branch.phone,
            address: branch.address,
            companyName,
          },
          products: pdfProducts,
        },
        this.buildCatalogFilename(branch.name)
      )

      this.showToast(
        'success',
        'Catálogo generado',
        'La descarga del PDF comenzó correctamente.'
      )
    } catch {
      this.showToast(
        'error',
        'No se pudo generar el PDF',
        'Intenta nuevamente en unos segundos.'
      )
    } finally {
      this.generatingCatalogPdf = false
    }
  }

  async shareProduct(
    product: PublicProduct | null,
    event?: Event
  ): Promise<void> {
    event?.stopPropagation()

    if (!product) return

    const shareUrl = this.getProductShareUrl(product.id)
    const shareData = {
      title: product.name,
      text: `Mira este producto: ${product.name}`,
      url: shareUrl,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }

      await this.copyToClipboard(shareUrl)
      await Swal.fire({
        icon: 'success',
        title: 'Enlace copiado',
        text: 'Puedes compartir el producto con ese enlace.',
        timer: 1800,
        showConfirmButton: false,
      })
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo compartir',
        text: 'Intenta nuevamente en unos segundos.',
      })
    }
  }
  getWhatsAppLink(product: PublicProduct): string {
    return this.catalogService.generateWhatsAppLink(product)
  }

  goToLogin(): void {
    const isLoggedIn = this.authService.isLoggedIn()

    if (isLoggedIn) {
      this.router.navigate(['/dashboard'])
      return
    }

    const companyParam = this.companyName()
    if (companyParam) {
      localStorage.setItem('catalog_company', companyParam)
      localStorage.setItem('catalog_company_name', companyParam)
    }

    window.location.href = '/auth/login'
  }

  isOutOfStock(product: PublicProduct): boolean {
    return product.quantity === 0
  }

  canShowWhatsAppButton(product: PublicProduct): boolean {
    return !this.isOutOfStock(product) && !!this.getWhatsAppLink(product)
  }

  getFilteredSubcategories() {
    return this.filters().subcategories
  }

  openImageModal(product: PublicProduct): void {
    this.selectedImageUrl =
      this.selectedProductImageUrl || this.getImageUrl(product)
    this.selectedProductName = product.name
    this.selectedProductCode = product.brand
    this.showImageModal = true
    this.updateBodyScrollState()
  }

  getProductGallery(product: PublicProduct | null): string[] {
    if (!product?.images?.length) {
      return ['assets/images/lentes.png']
    }

    return product.images
      .map((img) => this.catalogService.getImageUrl(img.path))
      .filter((url) => !!url)
  }

  selectProductImage(url: string): void {
    this.selectedProductImageUrl = url
    if (this.showImageModal) {
      this.selectedImageUrl = url
    }
  }

  nextProductImage(): void {
    const product = this.selectedProduct
    if (!product) return

    const gallery = this.getProductGallery(product)
    if (gallery.length <= 1) return

    const currentIndex = Math.max(
      0,
      gallery.findIndex((img) => img === this.selectedProductImageUrl)
    )
    const nextIndex = (currentIndex + 1) % gallery.length
    this.selectProductImage(gallery[nextIndex])
  }

  previousProductImage(): void {
    const product = this.selectedProduct
    if (!product) return

    const gallery = this.getProductGallery(product)
    if (gallery.length <= 1) return

    const currentIndex = Math.max(
      0,
      gallery.findIndex((img) => img === this.selectedProductImageUrl)
    )
    const previousIndex = (currentIndex - 1 + gallery.length) % gallery.length
    this.selectProductImage(gallery[previousIndex])
  }

  closeImageModal(): void {
    this.showImageModal = false
    this.selectedImageUrl = ''
    this.selectedProductName = ''
    this.selectedProductCode = ''
    this.updateBodyScrollState()
  }

  toggleFilters(): void {
    if (this.isMobileViewport()) {
      this.isFiltersDrawerOpen = !this.isFiltersDrawerOpen
    }
  }

  closeFiltersDrawer(): void {
    this.isFiltersDrawerOpen = false
  }

  getPaginationArray(): number[] {
    const total = this.totalPages()
    const current = this.currentPage()
    const delta = 2
    const range: number[] = []
    const rangeWithDots: number[] = []

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i)
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, -1)
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (current + delta < total - 1) {
      rangeWithDots.push(-1, total)
    } else if (total > 1) {
      rangeWithDots.push(total)
    }

    return rangeWithDots
  }

  private applySelectedProduct(product: PublicProduct): void {
    this.selectedProduct = product
    this.selectedProductImageUrl = this.getImageUrl(product)
    this.showProductModal = true
    this.updateBodyScrollState()
  }

  private openProductFromUrl(productId: string): void {
    this.hasProcessedInitialProductFromUrl = true

    const companyName = this.companyName()
    if (companyName) {
      localStorage.setItem('catalog_company_name', companyName)
    }

    this.catalogService.getProductById(productId).subscribe({
      next: (product) => {
        this.applySelectedProduct(product)
      },
      error: () => {
        this.pendingProductIdFromUrl = null
        this.updateProductQueryParam(null)
      },
    })
  }

  private updateProductQueryParam(productId: string | null): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { productId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }

  private getProductShareUrl(productId: string): string {
    const companySegment = this.companyName() ? `/${this.companyName()}` : ''
    const baseUrl = `${window.location.origin}/catalog${companySegment}`
    return `${baseUrl}?productId=${productId}`
  }

  private async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  private updateBodyScrollState(): void {
    const shouldLockBody =
      this.isCartOpen || this.showProductModal || this.showImageModal
    document.body.style.overflow = shouldLockBody ? 'hidden' : 'auto'
  }

  private buildBranchMessage(group: CartBranchGroup): string {
    const lines = group.items.map((item, index) => {
      const subtotal = item.unitPrice * item.quantity
      return `${index + 1}. ${item.name}\nCantidad: ${item.quantity}\nPrecio: $${item.unitPrice.toFixed(2)}\nSubtotal: $${subtotal.toFixed(2)}`
    })

    return [
      `Hola, quisiera consultar por estos productos de la sucursal *${group.branchName}*`,
      '',
      ...lines,
      '',
      `Total: *$${group.totalAmount.toFixed(2)}*`,
    ].join('\n')
  }

  private resolveBranchPhoneForGroup(group: CartBranchGroup): string {
    const phoneFromFilters = this.filters().branches.find(
      (branch) => branch.id === group.branchId
    )?.phone

    const phoneFromProducts = this.products().find((product) => {
      const branchId = product.branch?.id || 'sin-sucursal'
      return branchId === group.branchId
    })?.branch?.phone

    const fallbackFromCart = group.branchPhone

    const candidates = [phoneFromFilters, phoneFromProducts, fallbackFromCart]
    for (const candidate of candidates) {
      if (!candidate) continue

      const formatted = this.catalogService.formatPhoneForWhatsApp(candidate)
      if (formatted) {
        return formatted
      }
    }

    return ''
  }

  private shouldHandleGalleryKeyboardNavigation(event: KeyboardEvent): boolean {
    if (!this.selectedProduct) {
      return false
    }

    if (!this.showImageModal && !this.showProductModal) {
      return false
    }

    const target = event.target as HTMLElement | null
    if (!target) {
      return this.getProductGallery(this.selectedProduct).length > 1
    }

    const interactiveTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']
    if (interactiveTags.includes(target.tagName) || target.isContentEditable) {
      return false
    }

    return this.getProductGallery(this.selectedProduct).length > 1
  }

  private async showWhatsAppBranchSelector(
    targets: WhatsAppBranchTarget[]
  ): Promise<void> {
    const linksHtml = targets
      .map(
        (target) =>
          `<a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" href="${target.link}" target="_blank" rel="noopener noreferrer"><span>${this.escapeHtml(
            target.branchName
          )}</span><small class="text-muted">${this.escapeHtml(
            target.phone
          )}</small></a>`
      )
      .join('')

    await Swal.fire({
      title: 'Sucursales para WhatsApp',
      html: `<p class="mb-2">Tu carrito tiene productos de <strong>${targets.length} sucursales diferentes</strong>. Cada sucursal maneja su propio inventario y atención al cliente, por eso debes contactarlas por separado.</p><p class="text-muted small mb-3">Hazlo clic en la sucursal que quieras consultar para abrir su WhatsApp.</p><div class="list-group text-start">${linksHtml}</div>`,
      icon: 'info',
      confirmButtonText: 'Listo',
      focusConfirm: false,
    })
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  private async loadProductsForBranchPdf(
    branchId: string,
    companyName: string
  ): Promise<PublicProduct[]> {
    const allProducts: PublicProduct[] = []
    const limit = 60
    let currentPage = 1
    let totalPages = 1

    do {
      const response = await firstValueFrom(
        this.catalogService.getProducts({
          companyName,
          branchId,
          page: currentPage,
          limit,
          sortBy: 'newest',
        })
      )

      if (response.items?.length) {
        allProducts.push(...response.items)
      }

      totalPages = Math.max(response.totalPages || 1, 1)
      currentPage += 1
    } while (currentPage <= totalPages)

    return allProducts
  }

  private resolveBranchInfoForPdf(
    branchId: string,
    products: PublicProduct[]
  ): { name: string; phone: string; address: string } {
    const branchFromFilters = this.filters().branches.find(
      (branch) => branch.id === branchId
    )
    const branchFromProducts = products.find((product) => {
      const currentBranchId = product.branch?.id || 'sin-sucursal'
      return currentBranchId === branchId
    })?.branch

    return {
      name:
        branchFromProducts?.name ||
        branchFromFilters?.name ||
        this.selectedBranchName ||
        'Sucursal',
      phone:
        branchFromProducts?.phone ||
        branchFromFilters?.phone ||
        'No disponible',
      address: branchFromProducts?.address || '',
    }
  }

  private resolveFinalProductPrice(product: PublicProduct): number {
    const discountPrice = product.discount?.finalPrice
    if (product.hasActiveDiscount && discountPrice !== undefined) {
      return Number(discountPrice)
    }

    return Number(product.unitPrice)
  }

  private buildCatalogFilename(branchName: string): string {
    const normalizedBranchName = branchName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')

    const date = new Date().toISOString().slice(0, 10)
    return `catalogo_${normalizedBranchName || 'sucursal'}_${date}.pdf`
  }

  private showToast(
    icon: 'success' | 'error' | 'warning' | 'info' | 'question',
    title: string,
    text: string
  ): void {
    void Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      text,
      timer: 2200,
      timerProgressBar: true,
      showConfirmButton: false,
    })
  }
}
