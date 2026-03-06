import { CommonModule } from '@angular/common'
import { Component, inject, OnInit, OnDestroy } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { BUTTON_ACTIONS } from '@core/helpers/ui/constants'
import {
  Product,
  Category,
  Subcategory,
  Supplier,
} from '@core/interfaces/api/inventory.interface'
import { ModalWithAction } from '@core/interfaces/ui/bootstrap-modal.interface'
import { ButtonAction } from '@core/interfaces/ui/ui.interface'
import { ProductService } from '@core/services/api/product.service'
import { CategoryService } from '@core/services/api/category.service'
import { SubcategoryService } from '@core/services/api/subcategory.service'
import { SupplierService } from '@core/services/api/supplier.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { NgSelectModule } from '@ng-select/ng-select'
import { TranslateModule } from '@ngx-translate/core'
import { Observable, of, map, tap, Subject, takeUntil, forkJoin } from 'rxjs'

interface ProductImagePreview {
  id?: string
  path?: string
  previewUrl: string
  isCover: boolean
  isExisting: boolean
  file?: File
}

@Component({
  selector: 'create-edit-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule],
  templateUrl: './create-edit-inventory.component.html',
  styleUrl: './create-edit-inventory.component.scss',
})
export class CreateEditInventoryComponent implements OnInit, OnDestroy {
  public BUTTON_ACTIONS = BUTTON_ACTIONS
  public form!: FormGroup
  public isEdit = false
  public isLoading = false
  public product?: Product
  public buttonAction?: ButtonAction

  public categories$: Observable<Category[]> = of([])
  public subcategories$: Observable<Subcategory[]> = of([])
  public filteredSubcategories$: Observable<Subcategory[]> = of([])
  public suppliers$: Observable<Supplier[]> = of([])

  public imagePreviews: ProductImagePreview[] = []
  public imageError: string | null = null
  public readonly maxImages = 5

  private unsubscribe$ = new Subject<void>()

  private _activeModal = inject(NgbActiveModal)
  private _fb = inject(FormBuilder)
  private _productService = inject(ProductService)
  private _categoryService = inject(CategoryService)
  private _subcategoryService = inject(SubcategoryService)
  private _supplierService = inject(SupplierService)
  private _bsModalService = inject(
    BootstrapModalService<ModalWithAction<Product>>
  )

  ngOnInit(): void {
    this.loadModalData()
    this.initializeForm()
    this.loadSelectData()
    this.setupSubcategoryFiltering()
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  private loadModalData(): void {
    this._bsModalService
      .getDataIssued()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: ModalWithAction<Product>) => {
        if (data) {
          this.buttonAction = data.buttonAction
          this.product = data.selectedRow
          this.isEdit = this.buttonAction === BUTTON_ACTIONS.EDIT

          if (this.form) {
            this.initializeForm()
            this.setupSubcategoryFiltering()
            this.initializeExistingImages()
          }
        }
      })
  }

  private initializeExistingImages(): void {
    this.imagePreviews = []

    if (!this.isEdit || !this.product?.images?.length) {
      return
    }

    this.imagePreviews = this.product.images.map((image) => ({
      id: image.id,
      path: image.path,
      previewUrl: this._productService.getImageUrl(image.path),
      isCover: image.isCover,
      isExisting: true,
    }))
  }

  private initializeForm(): void {
    this.form = this._fb.group({
      code: [
        { value: this.product?.code || '', disabled: false },
        [Validators.required, Validators.maxLength(50)],
      ],
      name: [
        { value: this.product?.name || '', disabled: false },
        [Validators.required, Validators.maxLength(100)],
      ],
      description: [
        { value: this.product?.description || '', disabled: false },
      ],
      categoryId: [
        { value: this.product?.categoryId || '', disabled: false },
        Validators.required,
      ],
      subcategoryId: [
        {
          value: this.product?.subcategoryId || '',
          disabled: !this.product?.categoryId,
        },
        Validators.required,
      ],
      brand: [
        { value: this.product?.brand || '', disabled: false },
        [Validators.required, Validators.maxLength(50)],
      ],
      unitPrice: [
        { value: this.product?.unitPrice || '', disabled: false },
        [Validators.required, Validators.min(0)],
      ],
      quantity: [
        { value: this.product?.quantity || '', disabled: false },
        [Validators.required, Validators.min(0)],
      ],
      defaultSupplierId: [
        { value: this.product?.defaultSupplierId || '', disabled: false },
        Validators.required,
      ],
      isActive: [{ value: this.product?.isActive ?? true, disabled: false }],
    })
  }

  private loadSelectData(): void {
    this.categories$ = this._categoryService
      .getAll()
      .pipe(
        tap((categories: any) =>
          console.log(' [CreateEditInventory] Categories loaded:', categories)
        )
      )

    this.subcategories$ = this._subcategoryService
      .getAll()
      .pipe(
        tap((subcategories: any) =>
          console.log(
            ' [CreateEditInventory] Subcategories loaded:',
            subcategories
          )
        )
      )

    this.suppliers$ = this._supplierService.findSuppliers({}).pipe(
      tap((res: any) =>
        console.log(' [CreateEditInventory] Suppliers response:', res)
      ),
      map((res: any) => {
        const suppliers = res.data?.data?.result || []
        console.log(' [CreateEditInventory] Mapped suppliers:', suppliers)
        return suppliers
      })
    )
  }

  private setupSubcategoryFiltering(): void {
    if (this.isEdit && this.product?.categoryId) {
      this.filteredSubcategories$ = this.subcategories$.pipe(
        map((subcategories) =>
          subcategories.filter(
            (sub) => sub.categoryId === this.product?.categoryId
          )
        )
      )
    } else {
      this.filteredSubcategories$ = of([])
      this.form.get('subcategoryId')?.disable()
    }

    this.form.get('categoryId')?.valueChanges.subscribe((categoryId) => {
      if (categoryId) {
        this.filteredSubcategories$ = this.subcategories$.pipe(
          map((subcategories) => {
            const filtered = subcategories.filter(
              (sub) => sub.categoryId === categoryId
            )
            return filtered
          })
        )

        this.form.get('subcategoryId')?.enable()

        const currentSubcategoryId = this.form.get('subcategoryId')?.value
        if (currentSubcategoryId) {
          this.subcategories$
            .pipe(
              map((subcategories) =>
                subcategories.find((sub) => sub.id === currentSubcategoryId)
              )
            )
            .subscribe((currentSubcategory) => {
              if (
                !currentSubcategory ||
                currentSubcategory.categoryId !== categoryId
              ) {
                this.form.get('subcategoryId')?.setValue('')
              }
            })
        }
      } else {
        this.filteredSubcategories$ = of([])
        this.form.get('subcategoryId')?.setValue('')
        this.form.get('subcategoryId')?.disable()
      }
    })
  }

  public onSubmit(): void {
    if (this.form.valid && !this.isLoading) {
      this.isLoading = true
      const formData = { ...this.form.value }

      if (!this.isEdit) {
        delete formData.isActive
      }

      const request$ = this.isEdit
        ? this._productService.updateProduct(this.product!.id, formData)
        : this._productService.createProduct(formData)

      request$.subscribe({
        next: (response: any) => {
          const newImages = this.imagePreviews.filter(
            (image) => !image.isExisting && image.file
          )

          if (newImages.length > 0) {
            const productId = this.isEdit ? this.product!.id : response.data.data.id

            const existingHasCover = this.imagePreviews.some(
              (img) => img.isExisting && img.isCover
            )
            let hasAssignedCover = existingHasCover

            const uploadRequests = newImages.map((image) => {
              const shouldBeCover = !hasAssignedCover
              if (shouldBeCover) {
                hasAssignedCover = true
              }

              return this._productService.uploadProductImage(
                productId,
                image.file as File,
                shouldBeCover
              )
            })

            forkJoin(uploadRequests).subscribe({
              next: () => {
                this.isLoading = false
                this._activeModal.close(this.isEdit ? 'updated' : 'created')
              },
              error: () => {
                this.isLoading = false
                this._activeModal.close(this.isEdit ? 'updated' : 'created')
              },
            })
          } else {
            this.isLoading = false
            this._activeModal.close(this.isEdit ? 'updated' : 'created')
          }
        },
        error: (error) => {
          this.isLoading = false
        },
      })
    }
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      this.imageError = null

      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
      const maxSize = 8 * 1024 * 1024
      const selectedFiles = Array.from(input.files)

      for (const file of selectedFiles) {
        if (this.imagePreviews.length >= this.maxImages) {
          this.imageError = `Solo puedes subir hasta ${this.maxImages} imágenes`
          break
        }

        if (!allowedTypes.includes(file.type)) {
          this.imageError = 'Solo se permiten archivos PNG, JPG, JPEG, WEBP'
          continue
        }

        if (file.size > maxSize) {
          this.imageError = 'El tamaño del archivo no debe exceder 8MB'
          continue
        }

        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (e.target?.result) {
            this.imagePreviews.push({
              previewUrl: e.target.result as string,
              isCover: false,
              isExisting: false,
              file,
            })
          }
        }
        reader.readAsDataURL(file)
      }
    }

    input.value = ''
  }

  public removeImage(image: ProductImagePreview, index: number): void {
    this.imageError = null

    if (image.isExisting && this.product?.id && image.id) {
      this._productService
        .deleteProductImage(this.product.id, image.id)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: () => {
            this.imagePreviews.splice(index, 1)
            if (this.product?.images) {
              this.product.images = this.product.images.filter(
                (img) => img.id !== image.id
              )
            }
          },
          error: (error) => {
            if (error?.status === 404) {
              this.imagePreviews.splice(index, 1)
            }
          },
        })
      return
    }

    this.imagePreviews.splice(index, 1)
  }

  public getPreviewUrl(image: ProductImagePreview): string {
    return image.previewUrl || 'assets/images/lentes.png'
  }

  public closeModal(): void {
    this._activeModal.close()
  }

  public getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName)
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return 'COMMON.VALIDATIONS.REQUIRED'
      }
      if (field.errors['maxlength']) {
        return 'COMMON.VALIDATIONS.MAX_LENGTH'
      }
      if (field.errors['min']) {
        return 'COMMON.VALIDATIONS.MIN_VALUE'
      }
    }
    return null
  }
}
