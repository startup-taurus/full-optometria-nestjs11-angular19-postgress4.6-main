import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgbActiveModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { Subject, takeUntil } from 'rxjs'
import { BaseStepModalComponent } from '../../../../../shared/components/base-step-modal/base-step-modal.component'
import { CompanyService } from '@core/services/api/company.service'
import { RoleService } from '@core/services/api/role.service'
import { BranchesService } from '@core/services/api/branches.service'
import { UserService } from '@core/services/api/user.service'
import {
  CreateCompanyCompleteDto,
  CreateCompanyDto,
  Company,
} from '@core/interfaces/api/company.interface'
import { Role } from '@core/interfaces/api/role.interface'
import { CreateBranchDto } from '@core/interfaces/api/branch.interface'
import { FilePreview } from '@core/interfaces/ui/file-preview.interface'
import { HttpClient } from '@angular/common/http'
import { environment } from '@environment/environment'
import Swal from 'sweetalert2'
import {
  SWAL_SUCCESS_CONFIG,
  SWAL_ERROR_CONFIG,
} from '@core/helpers/ui/ui.constants'
import { Clipboard } from '@angular/cdk/clipboard'
import { ToastrNotificationService } from '@core/services/ui/notification.service'

@Component({
  selector: 'app-company-setup-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    BaseStepModalComponent,
    NgbTooltipModule,
  ],
  templateUrl: './company-setup-modal.component.html',
  styleUrls: ['./company-setup-modal.component.scss'],
})
export class CompanySetupModalComponent implements OnInit, OnDestroy {
  @ViewChild('logoInput') logoInput!: ElementRef

  public selectedCompany?: Company
  public isEditMode = false

  private destroy$ = new Subject<void>()
  private _fb = inject(FormBuilder)
  private _activeModal = inject(NgbActiveModal)
  private _companyService = inject(CompanyService)
  private _roleService = inject(RoleService)
  private _branchService = inject(BranchesService)
  private _userService = inject(UserService)
  private _translateService = inject(TranslateService)
  private _http = inject(HttpClient)
  private _clipboard = inject(Clipboard)
  private _notificationService = inject(ToastrNotificationService)

  public currentStep = 1
  public totalSteps = 4
  public isLoading = false
  public stepLabels: string[] = []
  public stepForms: { [key: number]: FormGroup } = {}
  private _canProceedNext = false

  public createdCompanyId: string | null = null
  public createdRoleId: string | null = null
  public createdBranchId: string | null = null

  public selectedLogoFile: File | null = null
  public logoPreviewUrl: string | null = null
  public uploadedLogoFileId: string | null = null
  public logoMarkedForDeletion = false

  get canProceedNext(): boolean {
    return this._canProceedNext
  }

  private updateCanProceedNext(): void {
    const currentForm = this.stepForms[this.currentStep]
    this._canProceedNext = currentForm?.valid || false
  }

  // private getInvalidControls(form: FormGroup | null): string[] {
  //   if (!form) return []

  //   const invalidControls: string[] = []
  //   Object.keys(form.controls).forEach((key) => {
  //     const control = form.get(key)
  //     if (control && control.invalid) {
  //       invalidControls.push(`${key}: ${JSON.stringify(control.errors)}`)
  //     }
  //   })
  //   return invalidControls
  // }

  ngOnInit(): void {
    this.loadStepLabels()
    this.initializeForms()

    if (this.isEditMode && this.selectedCompany) {
      this.loadCompanyData()
      this.totalSteps = 1
    }

    this.subscribeToFormChanges()
    this.updateCanProceedNext()
  }

  private subscribeToFormChanges(): void {
    Object.keys(this.stepForms).forEach((key) => {
      this.stepForms[+key].valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateCanProceedNext()
        })
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private loadStepLabels(): void {
    this.stepLabels = [
      this._translateService.instant('COMPANIES_MODULE.STEP1_COMPANY'),
      this._translateService.instant('COMPANIES_MODULE.STEP2_ROLE'),
      this._translateService.instant('COMPANIES_MODULE.STEP3_BRANCH'),
      this._translateService.instant('COMPANIES_MODULE.STEP4_USER'),
    ]
  }

  private initializeForms(): void {
    this.stepForms[1] = this._fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      code: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(20),
        ],
      ],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      phone: ['', [Validators.maxLength(20)]],
      slug: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-z0-9-]+$/),
          Validators.maxLength(80),
        ],
      ],
      maxUsers: [null, [Validators.min(1)]],
      maxBranches: [null, [Validators.min(1)]],
    })

    this.stepForms[2] = this._fb.group({
      roleName: ['', [Validators.required]],
      description: ['', [Validators.required]],
    })

    this.stepForms[3] = this._fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(20)]],
      address: ['', [Validators.required, Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      phone: ['', [Validators.maxLength(20)]],
      corporateEmail: ['', [Validators.email]],
      openingHours: ['', [Validators.maxLength(100)]],
    })

    this.stepForms[4] = this._fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        roleId: ['', [Validators.required]],
        branchId: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        documentNumber: ['', [Validators.required]],
        dateOfBirth: ['', [Validators.required]],
        mobilePhone: [
          '',
          [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)],
        ],
        address: [''],
        homePhone: [''],
      },
      {
        validators: this.passwordMatchValidator, // Validator para confirmar contraseña
      }
    )
  }

  public onStepChange(step: number): void {
    if (step <= this.currentStep) {
      this.currentStep = step

      if (step === 4 && this.createdRoleId && this.createdBranchId) {
        this.populateUserFormDefaults()
      }

      this.updateCanProceedNext()
      return
    }

    return
  }

  public onNextStep(): void {
    if (this.stepForms[this.currentStep].invalid) {
      this.stepForms[this.currentStep].markAllAsTouched()
      return
    }

    if (this.isEditMode) {
      return
    }

    switch (this.currentStep) {
      case 1:
        if (!this.createdCompanyId) {
          this.createCompany()
        } else {
          this.currentStep = 2
          this.updateCanProceedNext()
        }
        break
      case 2:
        if (!this.createdRoleId) {
          this.createRole()
        } else {
          this.currentStep = 3
          this.updateCanProceedNext()
        }
        break
      case 3:
        if (!this.createdBranchId) {
          this.createBranch()
        } else {
          this.populateUserFormDefaults()
          this.currentStep = 4
          this.updateCanProceedNext()
        }
        break
      case 4:
        break
    }
  }

  public onSave(): void {
    if (this.isEditMode) {
      this.updateCompany()
      return
    }

    if (this.stepForms[4].invalid) {
      this.stepForms[4].markAllAsTouched()
      return
    }

    if (
      !this.createdCompanyId ||
      !this.createdRoleId ||
      !this.createdBranchId
    ) {
      Swal.fire({
        ...SWAL_ERROR_CONFIG,
        title: 'Error',
        text: 'Faltan datos de compañia, rol o sucursal.',
      })
      return
    }

    this.isLoading = true

    const formValue = { ...this.stepForms[4].value }

    delete formValue.confirmPassword

    if (formValue.dateOfBirth) {
      if (
        typeof formValue.dateOfBirth === 'string' &&
        formValue.dateOfBirth.trim() !== ''
      ) {
        try {
          let isoString: string

          if (/^\d{4}-\d{2}-\d{2}$/.test(formValue.dateOfBirth)) {
            const [year, month, day] = formValue.dateOfBirth
              .split('-')
              .map((n: string) => parseInt(n, 10))
            const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

            if (!isNaN(date.getTime())) {
              isoString = date.toISOString()
              formValue.dateOfBirth = isoString
            } else {
            }
          } else {
            const date = new Date(formValue.dateOfBirth)
            if (!isNaN(date.getTime())) {
              isoString = date.toISOString()
              formValue.dateOfBirth = isoString
            } else {
            }
          }
        } catch (error) {}
      } else if (
        formValue.dateOfBirth === '' ||
        formValue.dateOfBirth === null ||
        formValue.dateOfBirth === undefined
      ) {
        delete formValue.dateOfBirth
      }
    }

    Object.keys(formValue).forEach((key) => {
      if (
        formValue[key] === '' ||
        formValue[key] === null ||
        formValue[key] === undefined
      ) {
        if (!['address', 'homePhone'].includes(key)) {
          delete formValue[key]
        } else {
          delete formValue[key]
        }
      }
    })

    const userData = {
      ...formValue,
      companyId: this.createdCompanyId,
      branchId: this.createdBranchId,
      roleId: this.createdRoleId,
    }

    this._userService
      .createUser(userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false
          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            title: 'Proceso completado',
            text: 'La compañia se ha creado exitosamente con su rol, sucursal y usuario administrador.',
          }).then(() => {
            this._activeModal.close('created')
          })
        },
        error: (error: any) => {
          this.isLoading = false
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: 'Error al crear usuario',
            text:
              error.error?.message || 'Ocurrió un error al crear el usuario.',
          })
        },
      })
  }

  public onCancel(): void {
    this._activeModal.dismiss()
  }

  public triggerLogoInput(): void {
    this.logoInput.nativeElement.click()
  }

  public onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) {
      return
    }

    const file = input.files[0]

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        ...SWAL_ERROR_CONFIG,
        title: 'Error',
        text: 'Por favor seleccione un archivo de imagen válido (PNG, JPG, JPEG, WEBP)',
      })
      return
    }

    const maxSize = 8 * 1024 * 1024
    if (file.size > maxSize) {
      Swal.fire({
        ...SWAL_ERROR_CONFIG,
        title: 'Error',
        text: 'El archivo es demasiado grande. El tamaño máximo es 8MB.',
      })
      return
    }

    this.selectedLogoFile = file
    this.logoMarkedForDeletion = false

    const reader = new FileReader()
    reader.onload = (e: any) => {
      this.logoPreviewUrl = e.target.result
    }
    reader.readAsDataURL(file)
  }

  public removeLogo(): void {
    this.selectedLogoFile = null
    this.logoPreviewUrl = null
    this.uploadedLogoFileId = null
    this.logoMarkedForDeletion = true
    if (this.logoInput) {
      this.logoInput.nativeElement.value = ''
    }
  }

  private async uploadLogo(): Promise<string | null> {
    if (!this.selectedLogoFile || !this.createdCompanyId) {
      return null
    }

    const formData = new FormData()
    formData.append('file', this.selectedLogoFile)
    formData.append('entityType', 'company')
    formData.append('entityId', this.createdCompanyId)
    formData.append('fileCategory', 'company_logo')

    try {
      const response = await this._http
        .post<any>(`${environment.apiBaseUrl}/files/upload`, formData)
        .toPromise()

      return response?.data?.id || null
    } catch (error) {
      return null
    }
  }

  public isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  public getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName)
    if (!field || !field.errors) return ''

    const errors = field.errors

    if (errors['required']) return 'VALIDATION.REQUIRED'
    if (errors['minlength']) return 'VALIDATION.MIN_LENGTH'
    if (errors['maxlength']) return 'VALIDATION.MAX_LENGTH'
    if (errors['email']) return 'VALIDATION.EMAIL_INVALID'
    if (errors['pattern']) return 'VALIDATION.PHONE_INVALID'
    if (errors['passwordMismatch']) return 'VALIDATION.PASSWORD_MISMATCH'

    return ''
  }

  public get urlPreview(): string {
    const slug = this.stepForms[1].get('slug')?.value || ''
    return slug ? `https://optometria.zgameslatam.com/catalog/${slug}` : ''
  }

  public onSlugInput(event: Event): void {
    const input = event.target as HTMLInputElement
    let value = input.value.toLowerCase()
    value = value.replace(/[^a-z0-9-]/g, '')
    this.stepForms[1].get('slug')?.setValue(value, { emitEvent: false })
  }

  public copySlugUrl(): void {
    if (!this.urlPreview) return
    const success = this._clipboard.copy(this.urlPreview)
    if (success) {
      this._notificationService.showNotification({
        title: this._translateService.instant('COMPANIES_MODULE.TITLE'),
        message: this._translateService.instant('COMPANIES_MODULE.URL_COPIED'),
        type: 'success',
      })
    }
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')
    const confirmPassword = form.get('confirmPassword')

    if (!password || !confirmPassword) return null

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true })
      return { passwordMismatch: true }
    }

    return null
  }

  private populateUserFormDefaults(): void {
    if (!this.stepForms[4]) {
      return
    }

    if (!this.createdRoleId) {
      return
    }

    if (!this.createdBranchId) {
      return
    }

    this.stepForms[4].patchValue({
      roleId: this.createdRoleId,
      branchId: this.createdBranchId,
    })

    this.stepForms[4].get('roleId')?.markAsTouched()
    this.stepForms[4].get('branchId')?.markAsTouched()

    this.stepForms[4].updateValueAndValidity()
  }

  private async createCompany(): Promise<void> {
    this.isLoading = true

    const companyData: CreateCompanyDto = {
      name: this.stepForms[1].value.name,
      code: this.stepForms[1].value.code,
      email: this.stepForms[1].value.email || undefined,
      phone: this.stepForms[1].value.phone || undefined,
      slug: this.stepForms[1].value.slug,
      maxUsers: this.stepForms[1].value.maxUsers || null,
      maxBranches: this.stepForms[1].value.maxBranches || null,
    }

    this._companyService
      .createCompany(companyData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response: any) => {
          this.createdCompanyId = response.data?.data?.id || response.data?.id

          if (this.selectedLogoFile && this.createdCompanyId) {
            const logoFileId = await this.uploadLogo()

            if (logoFileId) {
              this.uploadedLogoFileId = logoFileId

              this._companyService
                .updateCompany(this.createdCompanyId, { logoFileId })
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {},
                  error: (error) => {},
                })
            }
          }

          this.isLoading = false
          this.currentStep = 2
          this.updateCanProceedNext()
        },
        error: (error) => {
          this.isLoading = false
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: 'Error al crear compañia',
            text:
              error.error?.message || 'Ocurrió un error al crear la compañia.',
          })
        },
      })
  }

  private createRole(): void {
    if (!this.createdCompanyId) {
      return
    }

    this.isLoading = true

    const roleData: any = {
      roleName: this.stepForms[2].value.roleName,
      description: this.stepForms[2].value.description,
      companyId: this.createdCompanyId,
    }

    this._roleService
      .createRole(roleData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.createdRoleId = response.data?.data?.id || response.data?.id
          this.isLoading = false
          this.currentStep = 3
          this.updateCanProceedNext()
        },
        error: (error) => {
          this.isLoading = false
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: 'Error al crear rol',
            text: error.error?.message || 'Ocurrió un error al crear el rol.',
          })
        },
      })
  }

  private createBranch(): void {
    if (!this.createdCompanyId) {
      return
    }

    this.isLoading = true

    const formValues = this.stepForms[3].value
    const branchData: any = {
      companyId: this.createdCompanyId,
      name: formValues.name,
      code: formValues.code,
      address: formValues.address,
      city: formValues.city,
    }

    if (formValues.phone && formValues.phone.trim()) {
      branchData.phone = formValues.phone.trim()
    }
    if (formValues.corporateEmail && formValues.corporateEmail.trim()) {
      branchData.corporateEmail = formValues.corporateEmail.trim()
    }
    if (formValues.openingHours && formValues.openingHours.trim()) {
      branchData.openingHours = formValues.openingHours.trim()
    }

    this._branchService
      .createBranch(branchData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.createdBranchId = response.data?.data?.id || response.data?.id

          this.populateUserFormDefaults()

          this.isLoading = false
          this.currentStep = 4
          this.updateCanProceedNext()
        },
        error: (error) => {
          this.isLoading = false
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: 'Error al crear sucursal',
            text:
              error.error?.message || 'Ocurrió un error al crear la sucursal.',
          })
        },
      })
  }

  private loadCompanyData(): void {
    if (!this.selectedCompany) return

    this.createdCompanyId = this.selectedCompany.id
    this.logoMarkedForDeletion = false

    this.stepForms[1].patchValue({
      name: this.selectedCompany.name,
      code: this.selectedCompany.code,
      email: this.selectedCompany.email || '',
      phone: this.selectedCompany.phone || '',
      slug: this.selectedCompany.slug || '',
      maxUsers: this.selectedCompany.maxUsers ?? null,
      maxBranches: this.selectedCompany.maxBranches ?? null,
    })

    if (this.selectedCompany.logoFile?.path) {
      this.logoPreviewUrl = `${environment.fileBaseUrl}/${this.selectedCompany.logoFile.path}`
      this.uploadedLogoFileId = this.selectedCompany.logoFile.id
    }
  }

  private async updateCompany(): Promise<void> {
    if (!this.selectedCompany || this.stepForms[1].invalid) {
      this.stepForms[1].markAllAsTouched()
      return
    }

    this.isLoading = true

    try {
      let newLogoFileId: string | null = null

      if (this.selectedLogoFile) {
        newLogoFileId = await this.uploadLogo()

        if (!newLogoFileId) {
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            title: 'Error',
            text: 'Error al subir el logo',
          })
          this.isLoading = false
          return
        }
      }

      const updateData: any = {
        name: this.stepForms[1].value.name,
        code: this.stepForms[1].value.code,
        email: this.stepForms[1].value.email || undefined,
        phone: this.stepForms[1].value.phone || undefined,
        slug: this.stepForms[1].value.slug,
        maxUsers: this.stepForms[1].value.maxUsers || null,
        maxBranches: this.stepForms[1].value.maxBranches || null,
      }

      if (newLogoFileId) {
        updateData.logoFileId = newLogoFileId
      } else if (this.logoMarkedForDeletion) {
        updateData.logoFileId = null
      }

      this._companyService
        .updateCompany(this.selectedCompany.id, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false
            Swal.fire({
              ...SWAL_SUCCESS_CONFIG,
              title: 'Actualizado',
              text: 'La compañía se ha actualizado exitosamente.',
            }).then(() => {
              this._activeModal.close({ success: true })
            })
          },
          error: (error) => {
            this.isLoading = false
            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: 'Error',
              text:
                error.error?.message ||
                'Ocurrió un error al actualizar la compañía.',
            })
          },
        })
    } catch (error) {
      this.isLoading = false
      Swal.fire({
        ...SWAL_ERROR_CONFIG,
        title: 'Error',
        text: 'Ocurrió un error inesperado.',
      })
    }
  }
}
