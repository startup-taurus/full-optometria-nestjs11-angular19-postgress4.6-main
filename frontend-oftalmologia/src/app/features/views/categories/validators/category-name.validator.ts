import { Injectable } from '@angular/core'
import {
  AbstractControl,
  AsyncValidator,
  ValidationErrors,
} from '@angular/forms'
import { Observable, of } from 'rxjs'
import {
  map,
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs/operators'
import { CategoriesManagementService } from '@core/services/api/categories-management.service'

@Injectable({
  providedIn: 'root',
})
export class CategoryNameValidator implements AsyncValidator {
  constructor(private categoriesService: CategoriesManagementService) {}

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.value || control.value.length < 2) {
      return of(null)
    }

    // Usar of(value) en lugar de control.valueChanges para evitar el bucle infinito
    return of(control.value).pipe(
      debounceTime(300),
      switchMap((value) => this.checkCategoryName(value)),
      map((exists) => (exists ? { categoryNameExists: true } : null)),
      catchError(() => of(null))
    )
  }

  private checkCategoryName(name: string): Observable<boolean> {
    return this.categoriesService.getCategories().pipe(
      map((categories) =>
        categories.some(
          (cat) => cat.name.toLowerCase().trim() === name.toLowerCase().trim()
        )
      ),
      catchError(() => of(false))
    )
  }

  // Validador para subcategorías que verifica unicidad dentro de la misma categoría
  validateSubcategoryName(categoryId: string, currentSubcategoryId?: string) {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.length < 2 || !categoryId) {
        return of(null)
      }

      // Usar of(value) en lugar de control.valueChanges para evitar el bucle infinito
      return of(control.value).pipe(
        debounceTime(300),
        switchMap((value) =>
          this.checkSubcategoryName(value, categoryId, currentSubcategoryId)
        ),
        map((exists) => (exists ? { subcategoryNameExists: true } : null)),
        catchError(() => of(null))
      )
    }
  }

  private checkSubcategoryName(
    name: string,
    categoryId: string,
    currentSubcategoryId?: string
  ): Observable<boolean> {
    return this.categoriesService.getSubcategories().pipe(
      map((subcategories) =>
        subcategories.some(
          (subcat) =>
            subcat.categoryId === categoryId &&
            subcat.name.toLowerCase().trim() === name.toLowerCase().trim() &&
            subcat.id !== currentSubcategoryId // Excluir la subcategoría actual en edición
        )
      ),
      catchError(() => of(false))
    )
  }
}
