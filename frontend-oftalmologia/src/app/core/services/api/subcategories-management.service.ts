import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import {
  Observable,
  forkJoin,
  map,
  filter,
  catchError,
  of,
  tap,
  startWith,
  retry,
  timeout,
} from 'rxjs'
import { SubcategoryService } from './subcategory.service'
import { CategoryService } from './category.service'
import { Subcategory, Category } from '@core/interfaces/api/inventory.interface'
import {
  ApiResponse,
  ApiData,
} from '@core/interfaces/api/api-response.interface'
import { environment } from '@environment/environment'

export interface SubcategoryWithCategory {
  id: string
  name: string
  description?: string
  isActive: boolean
  branchId: string
  categoryId: string
  category?: Category
  createdAt: Date
  updatedAt: Date
}

export interface SubcategoryFilter {
  search?: string
  categoryId?: string
  isActive?: boolean
  page?: number
  limit?: number
}

@Injectable({
  providedIn: 'root',
})
export class SubcategoriesManagementService {
  private readonly subcategoriesUrl = `${environment.apiBaseUrl}/subcategories`

  constructor(
    private http: HttpClient,
    private subcategoryService: SubcategoryService,
    private categoryService: CategoryService
  ) {}

  private extractSubcategoriesData(response: any): Subcategory[] {
    const result = response?.data?.data?.result || []
    return result
  }

  getSubcategories(filter: SubcategoryFilter = {}): Observable<Subcategory[]> {
    const finalFilter = { ...filter }
    if (!finalFilter.limit) {
      finalFilter.limit = 1000
    }

    return this.http
      .get<any>(`${this.subcategoriesUrl}/get-all`, {
        params: this.buildParams(finalFilter),
      })
      .pipe(
        tap((response) =>
          console.log(
            '[SubcategoriesService] Subcategories HTTP response:',
            response
          )
        ),
        map((response) => this.extractSubcategoriesData(response)),
        tap((subcategories) =>
          console.log(
            '[SubcategoriesService] Final subcategories:',
            subcategories
          )
        ),
        catchError((error) => {
          console.error(
            '[SubcategoriesService] Error loading subcategories:',
            error
          )
          return of([])
        })
      )
  }

  getSubcategoriesWithCategories(
    filter: SubcategoryFilter = {}
  ): Observable<SubcategoryWithCategory[]> {
    return forkJoin({
      subcategories: this.getSubcategories(filter).pipe(
        timeout(30000),
        retry(1),
        startWith([])
      ),
      categories: this.categoryService
        .getAll()
        .pipe(timeout(30000), retry(1), startWith([])),
    }).pipe(
      tap(() =>
        console.log(
          '[SubcategoriesService] 🔄 forkJoin completed - building subcategories with categories'
        )
      ),
      map(({ subcategories, categories }) => {
        const subcategoriesWithCategories: SubcategoryWithCategory[] =
          subcategories.map((subcategory: Subcategory) => {
            const category = categories.find(
              (cat: Category) => cat.id === subcategory.categoryId
            )

            return {
              id: subcategory.id,
              name: subcategory.name,
              description: subcategory.description,
              isActive: subcategory.isActive,
              branchId: subcategory.branchId,
              categoryId: subcategory.categoryId,
              category,
              createdAt:
                typeof subcategory.createdAt === 'string'
                  ? new Date(subcategory.createdAt)
                  : subcategory.createdAt || new Date(),
              updatedAt:
                typeof subcategory.updatedAt === 'string'
                  ? new Date(subcategory.updatedAt)
                  : subcategory.updatedAt || new Date(),
            }
          })

        return subcategoriesWithCategories
      }),
      catchError((error) => {
        return of([])
      })
    )
  }

  createSubcategory(subcategoryData: any): Observable<Subcategory> {
    return this.http
      .post<any>(`${this.subcategoriesUrl}/create`, subcategoryData)
      .pipe(
        map((response) => response?.data || null),
        filter((result): result is Subcategory => result !== null),
        catchError((error) => {
          console.error('Error creating subcategory:', error)
          throw error
        })
      )
  }

  updateSubcategory(id: string, subcategoryData: any): Observable<Subcategory> {
    return this.http
      .patch<any>(`${this.subcategoriesUrl}/update/${id}`, subcategoryData)
      .pipe(
        map((response) => response?.data || null),
        filter((result): result is Subcategory => result !== null),
        catchError((error) => {
          console.error('Error updating subcategory:', error)
          throw error
        })
      )
  }

  deleteSubcategory(id: string): Observable<void> {
    return this.http.delete<any>(`${this.subcategoriesUrl}/delete/${id}`).pipe(
      map(() => void 0),
      catchError((error) => {
        throw error
      })
    )
  }

  getSubcategoryById(id: string): Observable<Subcategory> {
    return this.http.get<any>(`${this.subcategoriesUrl}/${id}`).pipe(
      map((response) => response?.data || null),
      filter((result): result is Subcategory => result !== null),
      catchError((error) => {
        throw error
      })
    )
  }

  private buildParams(filter: SubcategoryFilter): { [key: string]: string } {
    const params: { [key: string]: string } = {}

    if (filter.search) params['search'] = filter.search
    if (filter.categoryId) params['categoryId'] = filter.categoryId
    if (filter.isActive !== undefined)
      params['isActive'] = filter.isActive.toString()
    if (filter.page) params['page'] = filter.page.toString()
    if (filter.limit) params['limit'] = filter.limit.toString()

    return params
  }
}
