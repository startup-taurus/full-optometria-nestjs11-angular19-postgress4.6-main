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
import { CategoryService } from './category.service'
import { SubcategoryService } from './subcategory.service'
import { Category, Subcategory } from '@core/interfaces/api/inventory.interface'
import {
  CategoryTreeNode,
  CreateCategoryDto,
  CreateSubcategoryDto,
  UpdateCategoryDto,
  UpdateSubcategoryDto,
} from '@core/interfaces/api/category-tree.interface'
import { ApiResponse } from '@core/interfaces/api/api-response.interface'
import { environment } from '@environment/environment'

@Injectable({
  providedIn: 'root',
})
export class CategoriesManagementService {
  private readonly categoriesUrl = `${environment.apiBaseUrl}/categories`
  private readonly subcategoriesUrl = `${environment.apiBaseUrl}/subcategories`

  constructor(
    private http: HttpClient,
    private categoryService: CategoryService,
    private subcategoryService: SubcategoryService
  ) {}

  private extractCategoriesData(response: any): Category[] {
    const result = response?.data?.data?.result || []
    return result
  }

  private extractSubcategoriesData(response: any): Subcategory[] {
    const result = response?.data?.data?.result || []
    return result
  }

  getCategories(): Observable<Category[]> {
    return this.http
      .get<any>(`${this.categoriesUrl}/get-all`, {
        params: { limit: '1000' },
      })
      .pipe(
        tap((response) =>
          console.log('[CategoriesService] Categories HTTP response:', response)
        ),
        map((response) => this.extractCategoriesData(response)),
        tap((categories) =>
          console.log('[CategoriesService] Final categories:', categories)
        ),
        catchError((error) => {
          console.error('[CategoriesService] Error loading categories:', error)
          return of([])
        })
      )
  }

  getSubcategories(): Observable<Subcategory[]> {
    return this.http
      .get<any>(`${this.subcategoriesUrl}/get-all`, {
        params: { limit: '1000' },
      })
      .pipe(
        tap((response) =>
          console.log(
            '[CategoriesService] Subcategories HTTP response:',
            response
          )
        ),
        map((response) => this.extractSubcategoriesData(response)),
        tap((subcategories) =>
          console.log('[CategoriesService] Final subcategories:', subcategories)
        ),
        catchError((error) => {
          return of([])
        })
      )
  }

  createCategory(data: CreateCategoryDto): Observable<Category> {
    return this.http.post<any>(`${this.categoriesUrl}/create`, data).pipe(
      map((response) => response?.data || null),
      filter((result): result is Category => result !== null),
      catchError((error) => {
        throw error
      })
    )
  }

  createSubcategory(data: CreateSubcategoryDto): Observable<Subcategory> {
    return this.http.post<any>(`${this.subcategoriesUrl}/create`, data).pipe(
      map((response) => response?.data || null),
      filter((result): result is Subcategory => result !== null),
      catchError((error) => {
        throw error
      })
    )
  }

  updateCategory(id: string, data: UpdateCategoryDto): Observable<Category> {
    return this.http
      .patch<any>(`${this.categoriesUrl}/update/${id}`, data)
      .pipe(
        map((response) => response?.data || null),
        filter((result): result is Category => result !== null),
        catchError((error) => {
          throw error
        })
      )
  }

  updateSubcategory(
    id: string,
    data: UpdateSubcategoryDto
  ): Observable<Subcategory> {
    return this.http
      .patch<any>(`${this.subcategoriesUrl}/update/${id}`, data)
      .pipe(
        map((response) => response?.data || null),
        filter((result): result is Subcategory => result !== null),
        catchError((error) => {
          throw error
        })
      )
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<any>(`${this.categoriesUrl}/delete/${id}`).pipe(
      map(() => void 0),
      catchError((error) => {
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

  getCategoriesTree(filters?: {
    search?: string
    isActive?: boolean
  }): Observable<CategoryTreeNode[]> {
    return forkJoin({
      categories: this.getCategories().pipe(
        timeout(30000),
        retry(1),
        startWith([])
      ),
      subcategories: this.getSubcategories().pipe(
        timeout(30000),
        retry(1),
        startWith([])
      ),
    }).pipe(
      tap(() => console.log('holap')),
      map(({ categories, subcategories }) => {
        const treeNodes: CategoryTreeNode[] = []

        let filteredCategories = categories
        let filteredSubcategories = subcategories

        if (filters?.search) {
          const searchTerm = filters.search.toLowerCase()
          filteredCategories = categories.filter((cat: Category) =>
            cat.name.toLowerCase().includes(searchTerm)
          )
          filteredSubcategories = subcategories.filter((sub: Subcategory) =>
            sub.name.toLowerCase().includes(searchTerm)
          )
        }

        if (filters?.isActive !== undefined) {
          filteredCategories = filteredCategories.filter(
            (cat: Category) => cat.isActive === filters.isActive
          )
          filteredSubcategories = filteredSubcategories.filter(
            (sub: Subcategory) => sub.isActive === filters.isActive
          )
        }

        filteredCategories.forEach((category: Category) => {
          const categoryNode: CategoryTreeNode = {
            id: category.id,
            name: category.name,
            description: category.description,
            isActive: category.isActive,
            type: 'category',
            level: 0,
            branchId: category.branchId,
            createdAt: category.createdAt || new Date(),
            updatedAt: category.updatedAt || new Date(),
          }
          treeNodes.push(categoryNode)

          const categorySubcategories = filteredSubcategories.filter(
            (sub: Subcategory) => sub.categoryId === category.id
          )

          categorySubcategories.forEach((subcategory: Subcategory) => {
            const subcategoryNode: CategoryTreeNode = {
              id: subcategory.id,
              name: subcategory.name,
              description: subcategory.description,
              isActive: subcategory.isActive,
              type: 'subcategory',
              parentId: category.id,
              categoryId: category.id,
              level: 1,
              branchId: subcategory.branchId,
              createdAt: subcategory.createdAt || new Date(),
              updatedAt: subcategory.updatedAt || new Date(),
            }
            treeNodes.push(subcategoryNode)
          })
        })

        return treeNodes
      }),
      catchError((error) => {
        return of([])
      })
    )
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http.get<any>(`${this.categoriesUrl}/${id}`).pipe(
      map((response) => response?.data || null),
      filter((result): result is Category => result !== null),
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
}
