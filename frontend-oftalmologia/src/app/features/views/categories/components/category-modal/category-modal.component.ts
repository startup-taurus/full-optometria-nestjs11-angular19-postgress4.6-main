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
import { Category } from '@core/interfaces/api/inventory.interface'
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@core/interfaces/api/category-tree.interface'

@Component({
  selector: 'app-category-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './category-modal.component.html',
  styleUrl: './category-modal.component.scss',
})
export class CategoryModalComponent implements OnInit {
  @Input() category?: Category
  @Input() mode: 'create' | 'edit' = 'create'
  @Output() categorySaved = new EventEmitter<Category>()

  categoryForm!: FormGroup
  isLoading = false

  constructor(
    private _activeModal: NgbActiveModal,
    private _fb: FormBuilder,
    private _categoriesService: CategoriesManagementService,
    private _translate: TranslateService,
    private _toastr: ToastrService
  ) {}

  ngOnInit() {
    this.initForm()
    if (this.mode === 'edit' && this.category) {
      this.populateForm()
    }
  }

  initForm() {
    const formConfig: any = {
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      description: ['', [Validators.maxLength(500)]],
    }

    if (this.mode === 'edit') {
      formConfig.isActive = [true]
    }

    this.categoryForm = this._fb.group(formConfig)
  }

  populateForm() {
    if (this.category) {
      const formValue: any = {
        name: this.category.name,
        description: this.category.description || '',
      }

      if (this.mode === 'edit') {
        formValue.isActive = this.category.isActive
      }

      this.categoryForm.patchValue(formValue)
    }
  }

  onSubmit() {
    if (this.categoryForm.valid && !this.isLoading) {
      this.isLoading = true
      const formData = this.categoryForm.value

      if (this.mode === 'create') {
        this.createCategory(formData)
      } else {
        this.updateCategory(formData)
      }
    } else {
      this.markFormGroupTouched()
    }
  }

  createCategory(data: CreateCategoryDto) {
    this._categoriesService.createCategory(data).subscribe({
      next: (category) => {
        this._toastr.success(
          this._translate.instant('CATEGORIES.MESSAGES.CATEGORY_CREATED'),
          this._translate.instant('COMMON.SUCCESS')
        )
        this.categorySaved.emit(category)
        this._activeModal.close(category)
      },
      error: (error) => {
        this._toastr.error(
          this._translate.instant('CATEGORIES.MESSAGES.ERROR_CREATING'),
          this._translate.instant('COMMON.ERROR')
        )
        this.isLoading = false
      },
    })
  }

  updateCategory(data: UpdateCategoryDto) {
    if (!this.category?.id) return

    this._categoriesService
      .updateCategory(this.category.id, data)
      .subscribe({
        next: (category) => {
          this._toastr.success(
            this._translate.instant('CATEGORIES.MESSAGES.CATEGORY_UPDATED'),
            this._translate.instant('COMMON.SUCCESS')
          )
          this.categorySaved.emit(category)
          this._activeModal.close(category)
        },
        error: (error) => {
          this._toastr.error(
            this._translate.instant('CATEGORIES.MESSAGES.ERROR_UPDATING'),
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
    Object.keys(this.categoryForm.controls).forEach((key) => {
      const control = this.categoryForm.get(key)
      if (control) {
        control.markAsTouched()
      }
    })
  }

  get name() {
    return this.categoryForm.get('name')
  }
  get description() {
    return this.categoryForm.get('description')
  }

  get modalTitle() {
    return this.mode === 'create'
      ? this._translate.instant('CATEGORIES.ACTIONS.CREATE_CATEGORY')
      : this._translate.instant('CATEGORIES.ACTIONS.EDIT_CATEGORY')
  }

  get submitButtonText() {
    return this.mode === 'create'
      ? this._translate.instant('COMMON.CREATE')
      : this._translate.instant('COMMON.UPDATE')
  }
}
