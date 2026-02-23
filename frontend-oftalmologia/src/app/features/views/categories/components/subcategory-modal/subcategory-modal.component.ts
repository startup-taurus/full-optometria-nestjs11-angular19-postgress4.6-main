import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms'
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ToastrService } from 'ngx-toastr'
import { CategoriesManagementService } from '@core/services/api/categories-management.service'
import { Category, Subcategory } from '@core/interfaces/api/inventory.interface'
import {
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
} from '@core/interfaces/api/category-tree.interface'

@Component({
  selector: 'app-subcategory-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './subcategory-modal.component.html',
  styleUrl: './subcategory-modal.component.scss',
})
export class SubcategoryModalComponent implements OnInit {
  @Input() subcategory?: Subcategory
  @Input() mode: 'create' | 'edit' = 'create'
  @Input() preselectedCategoryId?: string
  @Output() subcategorySaved = new EventEmitter<Subcategory>()

  subcategoryForm!: FormGroup
  isLoading = false
  categories: Category[] = []
  isLoadingCategories = false

  constructor(
    private _activeModal: NgbActiveModal,
    private _fb: FormBuilder,
    private _categoriesService: CategoriesManagementService,
    private _translate: TranslateService,
    private _toastr: ToastrService
  ) {}

  ngOnInit() {
    this.initForm()
    this.loadCategories()

    if (this.mode === 'edit' && this.subcategory) {
      this.populateForm()
    } else if (this.preselectedCategoryId) {
      this.subcategoryForm.patchValue({
        categoryId: this.preselectedCategoryId,
      })
    }
  }

  initForm() {
    const formConfig: any = {
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      description: ['', [Validators.maxLength(500)]],
      categoryId: ['', [Validators.required]],
    }

    if (this.mode === 'edit') {
      formConfig.isActive = [true]
    }

    this.subcategoryForm = this._fb.group(formConfig)
  }

  populateForm() {
    if (this.subcategory) {
      const formValue: any = {
        name: this.subcategory.name,
        description: this.subcategory.description || '',
        categoryId: this.subcategory.categoryId,
      }

      if (this.mode === 'edit') {
        formValue.isActive = this.subcategory.isActive
      }

      this.subcategoryForm.patchValue(formValue)
    }
  }

  loadCategories() {
    this.isLoadingCategories = true
    this._categoriesService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter((cat) => cat.isActive)
        this.isLoadingCategories = false
      },
      error: (error) => {
        this._toastr.error(
          this._translate.instant(
            'CATEGORIES.MESSAGES.ERROR_LOADING_CATEGORIES'
          ),
          this._translate.instant('COMMON.ERROR')
        )
        this.isLoadingCategories = false
      },
    })
  }

  onSubmit() {
    if (this.subcategoryForm.valid && !this.isLoading) {
      this.isLoading = true
      const formData = this.subcategoryForm.value

      if (this.mode === 'create') {
        this.createSubcategory(formData)
      } else {
        this.updateSubcategory(formData)
      }
    } else {
      this.markFormGroupTouched()
    }
  }

  createSubcategory(data: CreateSubcategoryDto) {
    this._categoriesService.createSubcategory(data).subscribe({
      next: (subcategory) => {
        this._toastr.success(
          this._translate.instant('CATEGORIES.MESSAGES.SUBCATEGORY_CREATED'),
          this._translate.instant('COMMON.SUCCESS')
        )
        this.subcategorySaved.emit(subcategory)
        this._activeModal.close(subcategory)
      },
      error: (error) => {
        this._toastr.error(
          this._translate.instant(
            'CATEGORIES.MESSAGES.ERROR_CREATING_SUBCATEGORY'
          ),
          this._translate.instant('COMMON.ERROR')
        )
        this.isLoading = false
      },
    })
  }

  updateSubcategory(data: UpdateSubcategoryDto) {
    if (!this.subcategory?.id) return

    this._categoriesService
      .updateSubcategory(this.subcategory.id, data)
      .subscribe({
        next: (subcategory) => {
          this._toastr.success(
            this._translate.instant('CATEGORIES.MESSAGES.SUBCATEGORY_UPDATED'),
            this._translate.instant('COMMON.SUCCESS')
          )
          this.subcategorySaved.emit(subcategory)
          this._activeModal.close(subcategory)
        },
        error: (error) => {
          this._toastr.error(
            this._translate.instant(
              'CATEGORIES.MESSAGES.ERROR_UPDATING_SUBCATEGORY'
            ),
            this._translate.instant('COMMON.ERROR')
          )
          this.isLoading = false
        },
      })
  }

  onCancel() {
    this._activeModal.dismiss()
  }

  private markFormGroupTouched() {
    Object.keys(this.subcategoryForm.controls).forEach((key) => {
      const control = this.subcategoryForm.get(key)
      if (control) {
        control.markAsTouched()
      }
    })
  }

  get name() {
    return this.subcategoryForm.get('name')
  }
  get description() {
    return this.subcategoryForm.get('description')
  }
  get categoryId() {
    return this.subcategoryForm.get('categoryId')
  }

  get modalTitle() {
    return this.mode === 'create'
      ? this._translate.instant('CATEGORIES.ACTIONS.CREATE_SUBCATEGORY')
      : this._translate.instant('CATEGORIES.ACTIONS.EDIT_SUBCATEGORY')
  }

  get submitButtonText() {
    return this.mode === 'create'
      ? this._translate.instant('COMMON.CREATE')
      : this._translate.instant('COMMON.UPDATE')
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find((cat) => cat.id === categoryId)
    return category?.name || ''
  }
}
