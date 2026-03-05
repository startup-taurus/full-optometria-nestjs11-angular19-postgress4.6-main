import { CommonModule } from '@angular/common'
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { CategoryTreeNode } from '@core/interfaces/api/category-tree.interface'
import { CategoriesManagementService } from '@core/services/api/categories-management.service'
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, catchError, of, Subject, takeUntil, tap, debounceTime, distinctUntilChanged, switchMap } from 'rxjs'
import { ToastrService } from 'ngx-toastr'
import { CategoryModalComponent } from '../../../views/categories/components/category-modal/category-modal.component'
import { SubcategoryModalComponent } from '../../../views/categories/components/subcategory-modal/subcategory-modal.component'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { selectSelectedBranchId } from '@core/states/branch/branch.selectors'
import Swal from 'sweetalert2'
import { SWAL_DELETE_CONFIRM_CONFIG, SWAL_SUCCESS_CONFIG, SWAL_ERROR_CONFIG } from '@core/helpers/ui/ui.constants'

@Component({
  selector: 'app-categories-table',
  standalone: true,
  imports: [CommonModule, TranslateModule, NgbModule],
  templateUrl: './categories-table.component.html',
  styleUrl: './categories-table.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CategoriesTableComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>()
  private readonly categoriesService = inject(CategoriesManagementService)
  private readonly modalService = inject(NgbModal)
  private readonly translate = inject(TranslateService)
  private readonly toastr = inject(ToastrService)
  private readonly store = inject(Store<AppState>)

  categoriesData$ = new BehaviorSubject<CategoryTreeNode[]>([])
  isLoading$ = new BehaviorSubject<boolean>(false)
  expandedCategories = new Set<string>()

  ngOnInit(): void {
    this.initializeBranchSubscription()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeBranchSubscription(): void {
    this.store.select(selectSelectedBranchId).pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged(), 
      debounceTime(300),
      tap((branchId) => {
        this.categoriesData$.next([])
        this.expandedCategories.clear()
      }),
      switchMap(() => {
        return this.loadCategoriesObservable()
      })
    ).subscribe({
      next: (categories) => {
       
        this.categoriesData$.next(categories)
        this.isLoading$.next(false)
      },
      error: (error) => {
        this.isLoading$.next(false)
        this.toastr.error(
          this.translate.instant('CATEGORIES.MESSAGES.ERROR_LOADING'),
          this.translate.instant('COMMON.ERROR')
        )
      }
    })
  }

  private loadCategoriesObservable() {
    this.isLoading$.next(true)
    return this.categoriesService.getCategoriesTree().pipe(
      catchError((error) => {
        return of([])
      })
    )
  }

  getCategoriesOnly(): CategoryTreeNode[] {
    return this.categoriesData$.value.filter(item => item.type === 'category')
  }

  getSubcategoriesForCategory(categoryId: string): CategoryTreeNode[] {
    return this.categoriesData$.value.filter(item => 
      item.type === 'subcategory' && item.parentId === categoryId
    )
  }

  toggleCategory(categoryId: string): void {
    if (this.expandedCategories.has(categoryId)) {
      this.expandedCategories.delete(categoryId)
    } else {
      this.expandedCategories.add(categoryId)
    }
  }

  onCategoryRowClick(categoryId: string, event: Event): void {
    const subcategories = this.getSubcategoriesForCategory(categoryId)
    if (subcategories.length > 0) {
      this.toggleCategory(categoryId)
    }
  }

  private loadCategories(): void {
    this.loadCategoriesObservable().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (categories) => {
        this.categoriesData$.next(categories)
        this.isLoading$.next(false)
      },
      error: (error) => {
        console.error('[CategoriesTable] Error in manual load:', error)
        this.isLoading$.next(false)
        this.toastr.error(
          this.translate.instant('CATEGORIES.MESSAGES.ERROR_LOADING'),
          this.translate.instant('COMMON.ERROR')
        )
      }
    })
  }

  onEditCategory(category: CategoryTreeNode): void {
    this.openCategoryModal(category, 'edit')
  }

  onEditSubcategory(subcategory: CategoryTreeNode): void {
    this.openSubcategoryModal(subcategory, 'edit')
  }

  onDeleteCategory(category: CategoryTreeNode): void {
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: this.translate.instant('CATEGORIES.MESSAGES.DELETE_CONFIRM_TITLE'),
      text: this.translate.instant('CATEGORIES.MESSAGES.DELETE_CONFIRM_TEXT'),
      confirmButtonText: this.translate.instant('COMMON.DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteCategory(category)
      }
    })
  }

  onDeleteSubcategory(subcategory: CategoryTreeNode): void {
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: this.translate.instant('CATEGORIES.MESSAGES.DELETE_CONFIRM_TITLE'),
      text: this.translate.instant('CATEGORIES.MESSAGES.DELETE_CONFIRM_TEXT'),
      confirmButtonText: this.translate.instant('COMMON.DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteCategory(subcategory)
      }
    })
  }

  private deleteCategory(category: CategoryTreeNode): void {
    const deleteMethod =
      category.type === 'category'
        ? this.categoriesService.deleteCategory(category.id)
        : this.categoriesService.deleteSubcategory(category.id)

    deleteMethod.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toastr.success(
          this.translate.instant('CATEGORIES.MESSAGES.DELETE_SUCCESS'),
          this.translate.instant('COMMON.SUCCESS')
        )
        this.loadCategories()
      },
      error: (error) => {
        console.error('Error deleting category:', error)
        
        let errorMessage = this.translate.instant('CATEGORIES.MESSAGES.DELETE_ERROR')
        
        if (error?.error?.message) {
          const currentLang = this.translate.currentLang || 'es'
          const backendMessage = error.error.message
          
          if (typeof backendMessage === 'object' && (backendMessage.es || backendMessage.en)) {
            errorMessage = backendMessage[currentLang] || backendMessage.es || backendMessage.en
          } else if (typeof backendMessage === 'string') {
            errorMessage = backendMessage
          }
        }
        
        this.toastr.error(
          errorMessage,
          this.translate.instant('COMMON.ERROR')
        )
      },
    })
  }

  onCreateCategory(): void {
    this.openCategoryModal(undefined, 'create')
  }

  onCreateSubcategory(parentCategoryId?: string): void {
    this.openSubcategoryModal(undefined, 'create', parentCategoryId)
  }

  private openCategoryModal(
    category?: CategoryTreeNode,
    mode: 'create' | 'edit' = 'create'
  ): void {
    const modalRef = this.modalService.open(CategoryModalComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: true,
    })

    modalRef.componentInstance.mode = mode
    if (category && mode === 'edit') {
      modalRef.componentInstance.category = {
        id: category.id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }
    }

    modalRef.componentInstance.categorySaved
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCategories()
      })
  }

  private openSubcategoryModal(
    subcategory?: CategoryTreeNode,
    mode: 'create' | 'edit' = 'create',
    preselectedCategoryId?: string
  ): void {
    const modalRef = this.modalService.open(SubcategoryModalComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: true,
    })

    modalRef.componentInstance.mode = mode
    if (subcategory && mode === 'edit') {
      modalRef.componentInstance.subcategory = {
        id: subcategory.id,
        name: subcategory.name,
        description: subcategory.description,
        categoryId: subcategory.parentId || '',
        isActive: subcategory.isActive,
        createdAt: subcategory.createdAt,
        updatedAt: subcategory.updatedAt,
      }
    } else if (preselectedCategoryId) {
      modalRef.componentInstance.preselectedCategoryId = preselectedCategoryId
    }

    modalRef.componentInstance.subcategorySaved
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCategories()
      })
  }
}