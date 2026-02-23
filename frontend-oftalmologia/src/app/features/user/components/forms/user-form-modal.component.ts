import { CommonModule } from '@angular/common'
import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { BUTTON_ACTIONS } from '@core/helpers/ui/constants'
import { Role } from '@core/interfaces/api/role.interface'
import { User, Branch } from '@core/interfaces/api/user.interface'
import { ButtonAction } from '@core/interfaces/ui/ui.interface'
import { ModalWithAction } from '@core/interfaces/ui/bootstrap-modal.interface'
import { RoleService } from '@core/services/api/role.service'
import { UserService } from '@core/services/api/user.service'
import { BranchService } from '@core/services/api/branch.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgSelectModule } from '@ng-select/ng-select'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { Observable, of, Subject, takeUntil } from 'rxjs'
import { map, tap } from 'rxjs/operators'

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule],
  templateUrl: './user-form-modal.component.html',
  styleUrls: ['./user-form-modal.component.scss'],
})
export class UserFormModalComponent implements OnInit, OnDestroy {
  @Output() userCreated = new EventEmitter<User>()
  @Output() userUpdated = new EventEmitter<User>()

  public userForm!: FormGroup
  public buttonAction: ButtonAction = BUTTON_ACTIONS.ADD
  public selectedUser?: User
  public roles$: Observable<Role[]> = of([])
  public branches$: Observable<Branch[]> = of([])
  public loading = false
  public isEditMode = false
  public modalTitle = ''

  private unsubscribe$ = new Subject<void>()

  private _formBuilder = inject(FormBuilder)
  private _userService = inject(UserService)
  private _roleService = inject(RoleService)
  private _branchService = inject(BranchService)
  private _activeModal = inject(NgbActiveModal)
  private _bsModalService = inject(BootstrapModalService<ModalWithAction<User>>)

  ngOnInit(): void {
    this.loadRoles()
    this.loadBranches()
    this.initializeForm()
    this.setModalTitle()

    this._bsModalService
      .getDataIssued()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: ModalWithAction<User>) => {
        this.setModalData(data)
      })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  public setModalData(data: ModalWithAction<User>): void {
    this.buttonAction = data.buttonAction
    this.selectedUser = data.selectedRow
    this.isEditMode = this.buttonAction === BUTTON_ACTIONS.EDIT

    this.initializeForm()

    if (this.isEditMode && data.selectedRow) {
      this.populateForm()
      this.loading = false
    } else {
      this.loading = false
    }

    this.setModalTitle()
  }

  private loadUserForEdit(userId: string): void {
    this.loading = true
    this._userService.getUserById(userId).subscribe({
      next: (response) => {
        this.selectedUser = response.data
        this.selectedUser = response.data
        if (this.userForm) {
          this.populateForm()
        }
        this.loading = false
      },
      error: (error) => {
        this.loading = false
      },
    })
  }
  private setModalTitle(): void {
    switch (this.buttonAction) {
      case BUTTON_ACTIONS.ADD:
        this.modalTitle = 'USER.MODAL.CREATE_TITLE'
        break
      case BUTTON_ACTIONS.EDIT:
        this.modalTitle = 'USER.MODAL.EDIT_TITLE'
        break
      case BUTTON_ACTIONS.VIEW:
        this.modalTitle = 'USER.MODAL.VIEW_TITLE'
        break
      default:
        this.modalTitle = 'USER.MODAL.TITLE'
    }
  }

  private loadRoles(): void {
    this.roles$ = this._roleService.getAllRoles('', 1, 100).pipe(
      map((response) => {
        if (response.data && response.data.result) {
          return response.data.result
        }
        return []
      }),
      tap((roles: Role[]) => {
        if (this.isEditMode && this.selectedUser && this.userForm) {
          setTimeout(() => {
            this.populateForm()
          }, 100)
        }
      })
    )
  }

  private loadBranches(): void {
    this.branches$ = this._branchService.getAllBranchesForSelector().pipe(
      tap((branches: Branch[]) => {
        if (this.isEditMode && this.selectedUser && this.userForm) {
          setTimeout(() => {
            this.populateForm()
          }, 100)
        }
      })
    )
  }

  private initializeForm(): void {
    const baseFormConfig: any = {
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      roleId: ['', [Validators.required]],
      branchId: ['', [Validators.required]],
      documentNumber: ['', [Validators.required, Validators.minLength(1)]],
      dateOfBirth: ['', [Validators.required]],
      mobilePhone: [
        '',
        [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)],
      ],
      address: [''],
      homePhone: [''],
      profilePhoto: [''],
      isActive: [true],
      isLocked: [false],
    }

    if (!this.isEditMode) {
      baseFormConfig.password = [
        '',
        [Validators.required, Validators.minLength(6)],
      ]
      baseFormConfig.confirmPassword = ['', [Validators.required]]
    }

    this.userForm = this._formBuilder.group(baseFormConfig, {
      validators: this.isEditMode ? null : this.passwordMatchValidator,
    })
  }

  private populateForm(): void {
    if (this.selectedUser) {
      let roleId = this.selectedUser.roleId
      if (!roleId && this.selectedUser.role && this.selectedUser.role.id) {
        roleId = this.selectedUser.role.id
      }

      let branchId = this.selectedUser.branchId
      if (
        !branchId &&
        this.selectedUser.branch &&
        this.selectedUser.branch.id
      ) {
        branchId = this.selectedUser.branch.id
      }

      let dateOfBirthForInput = ''
      if (this.selectedUser.dateOfBirth) {
        try {
          const date = new Date(this.selectedUser.dateOfBirth)
          if (!isNaN(date.getTime())) {
            dateOfBirthForInput = date.toISOString().split('T')[0]
          }
        } catch (error) {}
      }

      const formData = {
        username: this.selectedUser.username,
        firstName: this.selectedUser.firstName,
        lastName: this.selectedUser.lastName,
        email: this.selectedUser.email,
        roleId: roleId,
        branchId: branchId,
        documentNumber: this.selectedUser.documentNumber || '',
        dateOfBirth: dateOfBirthForInput,
        address: this.selectedUser.address || '',
        homePhone: this.selectedUser.homePhone || '',
        mobilePhone: this.selectedUser.mobilePhone || '',
        profilePhoto: this.selectedUser.profilePhoto || '',
        isActive: this.selectedUser.isActive ?? true,
        isLocked: this.selectedUser.isLocked ?? false,
      }

      this.userForm.patchValue(formData)
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

  public onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched()
      return
    }

    this.loading = true
    const formData = this.prepareFormData()

    if (this.isEditMode && this.selectedUser) {
      this.updateUser(formData)
    } else {
      this.createUser(formData)
    }
  }

  private prepareFormData(): any {
    const formValue = { ...this.userForm.value }

    delete formValue.confirmPassword

    if (this.isEditMode && !formValue.password) {
      delete formValue.password
    }

    if (!this.isEditMode) {
      delete formValue.isActive
      delete formValue.isLocked
    }

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
        if (['address', 'homePhone', 'profilePhoto'].includes(key)) {
          delete formValue[key]
        }
      }
    })

    return formValue
  }

  private createUser(userData: any): void {
    this._userService
      .createUser(userData)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          this.loading = false
          this.userCreated.emit(response.data)
          this._activeModal.close('created')
        },
        error: (error) => {
          console.error(' UserFormModal - Create user ERROR:', error)
          this.loading = false
        },
      })
  }

  private updateUser(userData: any): void {
    if (!this.selectedUser?.id) return

    this._userService
      .updateUser(this.selectedUser.id, userData)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          this.loading = false
          this.userUpdated.emit(response.data)
          this._activeModal.close('updated')
        },
        error: (error) => {
          console.error(' UserFormModal - Update user ERROR:', error)
          this.loading = false
        },
      })
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach((key) => {
      const control = this.userForm.get(key)
      control?.markAsTouched()
    })
  }

  public isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  public getFieldError(fieldName: string): string | null {
    const field = this.userForm.get(fieldName)
    if (!field || field.valid) return null

    if (field.hasError('required')) return 'VALIDATION.REQUIRED'
    if (field.hasError('email')) return 'VALIDATION.EMAIL_INVALID'
    if (field.hasError('minlength')) return 'VALIDATION.MIN_LENGTH'
    if (field.hasError('pattern')) return 'VALIDATION.PHONE_INVALID'
    if (field.hasError('passwordMismatch'))
      return 'VALIDATION.PASSWORD_MISMATCH'

    return null
  }

  public onCancel(): void {
    this._activeModal.dismiss('cancel')
  }
}
