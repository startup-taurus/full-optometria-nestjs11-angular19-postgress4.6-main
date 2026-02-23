import { Component, OnInit, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, RouterModule, ActivatedRoute } from '@angular/router'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { PublicCatalogService } from '@core/services/api/public-catalog.service'
import { AuthenticationService } from '@core/services/api/auth.service'
import {
  PublicProduct,
  PublicProductFilters,
  PublicProductQuery,
} from '@core/interfaces/api/public-product.interface'
import { DefaultZgamesComponent } from '../default-zgames/default-zgames.component'
import Swal from 'sweetalert2'

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

  companyName = signal<string>('')
  isValidCompany = signal<boolean>(false)
  isCheckingCompany = signal<boolean>(true)
  backendError = signal(false)

  products = signal<PublicProduct[]>([])
  filters = signal<PublicProductFilters>({
    categories: [],
    subcategories: [],
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

  searchName = ''
  searchDescription = ''
  minPrice: number | undefined = undefined
  maxPrice: number | undefined = undefined
  sortBy: 'views' | 'price-asc' | 'price-desc' | 'newest' = 'newest'

  showFilters = false

  get filterToggleIcon(): string {
    return this.showFilters ? 'mdi:chevron-up' : 'mdi:chevron-down'
  }

  ngOnInit(): void {
    if (window.innerWidth >= 992) {
      this.showFilters = true
    }

    this.route.paramMap.subscribe((params) => {
      const companyParam = params.get('companyName')
      if (companyParam) {
        this.companyName.set(companyParam)
        this.validateCompanyAndLoad()
      } else {
        this.isValidCompany.set(false)
        this.isCheckingCompany.set(false)
      }
    })
  }
  private validateCompanyAndLoad(): void {
    const companyNameValue = this.companyName()

    this.catalogService.validateCompany(companyNameValue).subscribe({
      next: (response) => {
        if (response.isValid) {
          this.isValidCompany.set(true)
          this.loadFilters()
          this.loadProducts()
        } else {
          this.isValidCompany.set(false)
        }
        this.isCheckingCompany.set(false)
      },
      error: () => {
        this.isValidCompany.set(false)
        this.isCheckingCompany.set(false)
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

    const query: PublicProductQuery = {
      companyName: this.companyName(),
      page: this.currentPage(),
      limit: 12,
    }

    const searchTerms: string[] = []
    if (this.searchName) searchTerms.push(this.searchName)
    if (this.searchDescription) searchTerms.push(this.searchDescription)
    if (searchTerms.length > 0) {
      query.search = searchTerms.join(' ')
    }

    if (this.minPrice !== undefined) query.minPrice = this.minPrice
    if (this.maxPrice !== undefined) query.maxPrice = this.maxPrice
    if (this.sortBy) query.sortBy = this.sortBy

    this.catalogService.getProducts(query).subscribe({
      next: (response) => {
        if (response && response.items && Array.isArray(response.items)) {
          this.products.set(response.items)
          this.totalCount.set(response.totalCount || 0)
          this.totalPages.set(response.totalPages || 0)
          this.backendError.set(false)
        } else {
          this.products.set([])
          this.totalCount.set(0)
          this.totalPages.set(0)
        }

        this.loading.set(false)
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
  }

  onFilterChange(): void {
    this.currentPage.set(1)
    this.loadProducts()
  }

  onCategoryChange(): void {
    this.onFilterChange()
  }

  clearFilters(): void {
    this.searchName = ''
    this.searchDescription = ''
    this.minPrice = undefined
    this.maxPrice = undefined
    this.sortBy = 'newest'
    this.currentPage.set(1)
    this.loadProducts()
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
    this.selectedProduct = product
    this.showProductModal = true
    document.body.style.overflow = 'hidden'

    this.catalogService.getProductById(product.id).subscribe({
      next: (updatedProduct) => {
        this.selectedProduct = updatedProduct
      },
      error: () => {
        this.selectedProduct = product
      },
    })
  }

  closeProductModal(): void {
    this.showProductModal = false
    this.selectedProduct = null
    document.body.style.overflow = 'auto'
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
      sessionStorage.setItem('catalog_company', companyParam)
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
    this.selectedImageUrl = this.getImageUrl(product)
    this.selectedProductName = product.name
    this.selectedProductCode = product.brand
    this.showImageModal = true
    document.body.style.overflow = 'hidden'
  }

  closeImageModal(): void {
    this.showImageModal = false
    this.selectedImageUrl = ''
    this.selectedProductName = ''
    this.selectedProductCode = ''
    document.body.style.overflow = 'auto'
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters
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
}
