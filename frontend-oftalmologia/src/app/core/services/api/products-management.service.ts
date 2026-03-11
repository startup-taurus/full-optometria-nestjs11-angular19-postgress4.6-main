import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import {
  Observable,
  forkJoin,
  map,
  filter,
  catchError,
  of,
  startWith,
  retry,
  timeout,
} from 'rxjs'
import { ProductService } from './product.service'
import { CategoryService } from './category.service'
import { SubcategoryService } from './subcategory.service'
import { SupplierService } from './supplier.service'
import {
  Product,
  Category,
  Subcategory,
  Supplier,
} from '@core/interfaces/api/inventory.interface'
import {
  ApiResponse,
  ApiData,
} from '@core/interfaces/api/api-response.interface'
import { environment } from '@environment/environment'

export interface ProductWithRelations {
  id: string
  code: string
  name: string
  brand: string
  unitPrice: number
  quantity: number
  isActive: boolean
  branchId: string
  category?: Category
  subcategory?: Subcategory
  supplier?: Supplier
  createdAt: Date
  updatedAt: Date
}

export interface ProductFilter {
  code?: string
  name?: string
  brand?: string
  unitPrice?: number
  quantity?: number
  categoryId?: string
  subcategoryId?: string
  supplierId?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface ApplyDiscountPayload {
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean
}

@Injectable({
  providedIn: 'root',
})
export class ProductsManagementService {
  private readonly productsUrl = `${environment.apiBaseUrl}/products`

  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private categoryService: CategoryService,
    private subcategoryService: SubcategoryService,
    private supplierService: SupplierService
  ) {}

  private extractProductsData(response: any): Product[] {
    return response?.data?.data?.result || []
  }

  getProducts(filter: ProductFilter = {}): Observable<Product[]> {
    return this.http
      .get<any>(`${this.productsUrl}/get-all`, {
        params: this.buildParams(filter),
      })
      .pipe(
        map((response) => this.extractProductsData(response)),
        catchError(() => of([]))
      )
  }

  getProductsWithRelations(
    filter: ProductFilter = {}
  ): Observable<ProductWithRelations[]> {

    return forkJoin({
      products: this.getProducts(filter).pipe(timeout(30000), startWith([])),
      categories: this.categoryService
        .getAll()
        .pipe(timeout(30000), retry(1), startWith([])),
      subcategories: this.subcategoryService
        .getAll()
        .pipe(timeout(30000), retry(1), startWith([])),
      suppliers: this.supplierService.findSuppliers({}).pipe(
        timeout(30000),
        retry(1),
        startWith({ data: { data: { result: [] } } }),
        map((response: any) => response?.data?.data?.result || [])
      ),
    }).pipe(
      map(({ products, categories, subcategories, suppliers }) => {
        const productsWithRelations: ProductWithRelations[] = products.map(
          (product: Product) => {
            const category = categories.find(
              (cat: Category) => cat.id === product.categoryId
            )
            const subcategory = subcategories.find(
              (sub: Subcategory) => sub.id === product.subcategoryId
            )
            const supplier = suppliers.find(
              (sup: Supplier) => sup.id === product.defaultSupplierId
            )

            return {
              id: product.id,
              code: product.code,
              name: product.name,
              brand: product.brand,
              unitPrice: product.unitPrice,
              quantity: product.quantity,
              isActive: product.isActive,
              branchId: product.branchId,
              category,
              subcategory,
              supplier,
              createdAt:
                typeof product.createdAt === 'string'
                  ? new Date(product.createdAt)
                  : product.createdAt || new Date(),
              updatedAt:
                typeof product.updatedAt === 'string'
                  ? new Date(product.updatedAt)
                  : product.updatedAt || new Date(),
            }
          }
        )

        return productsWithRelations
      }),
      catchError((error) => {
        return of([])
      })
    )
  }

  createProduct(productData: any): Observable<Product> {
    return this.productService.createProduct(productData).pipe(
      map((response) => response?.data || null),
      filter((result): result is Product => result !== null),
      catchError((error) => {
        throw error
      })
    )
  }

  updateProduct(id: string, productData: any): Observable<Product> {
    return this.productService.updateProduct(id, productData).pipe(
      map((response) => response?.data || null),
      filter((result): result is Product => result !== null),
      catchError((error) => {
        throw error
      })
    )
  }

  deleteProduct(id: string): Observable<void> {
    return this.productService.deleteProduct(id).pipe(
      map(() => void 0),
      catchError((error) => {
        throw error
      })
    )
  }

  getProductById(id: string): Observable<Product> {
    return this.productService.getProductById(id).pipe(
      map((response) => response || null),
      filter((result): result is Product => result !== null),
      catchError((error) => {
        throw error
      })
    )
  }

  applyDiscount(
    productId: string,
    payload: ApplyDiscountPayload
  ): Observable<any> {
    return this.http.post<any>(`${this.productsUrl}/${productId}/apply-discount`, payload)
  }

  removeDiscount(productId: string): Observable<any> {
    return this.http.delete<any>(`${this.productsUrl}/${productId}/remove-discount`)
  }

  private buildParams(filter: ProductFilter): { [key: string]: string } {
    const params: { [key: string]: string } = {}

    if (filter.code) params['code'] = filter.code
    if (filter.name) params['name'] = filter.name
    if (filter.brand) params['brand'] = filter.brand
    if (filter.unitPrice !== undefined)
      params['unitPrice'] = filter.unitPrice.toString()
    if (filter.quantity !== undefined)
      params['quantity'] = filter.quantity.toString()
    if (filter.categoryId) params['categoryId'] = filter.categoryId
    if (filter.subcategoryId) params['subcategoryId'] = filter.subcategoryId
    if (filter.supplierId) params['supplierId'] = filter.supplierId
    if (filter.isActive !== undefined)
      params['isActive'] = filter.isActive.toString()
    if (filter.page) params['page'] = filter.page.toString()
    if (filter.limit) params['limit'] = filter.limit.toString()

    return params
  }
}
