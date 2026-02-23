import { Component, inject, OnInit } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { TranslatePipe } from '@ngx-translate/core'
import { UserService } from '@core/services/api/user.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'change-password',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm!: FormGroup
  isLoading = false
  isValidatingCurrentPassword = false
  currentPasswordValidated = false
  currentPasswordValue = ''
  showCurrentPassword = false
  showNewPassword = false
  showConfirmPassword = false

  private fb = inject(FormBuilder)
  private userService = inject(UserService)
  private notificationService = inject(ToastrNotificationService)

  ngOnInit(): void {
    this.initForm()
    this.setupFormListeners()
  }

  private setupFormListeners(): void {
    if (this.currentPasswordValidated) {
      const newPasswordControl = this.changePasswordForm.get('newPassword')
      const confirmPasswordControl =
        this.changePasswordForm.get('confirmPassword')

      if (newPasswordControl && confirmPasswordControl) {
        newPasswordControl.valueChanges.subscribe(() => {
          if (confirmPasswordControl.value) {
            this.changePasswordForm.updateValueAndValidity()
          }
        })

        confirmPasswordControl.valueChanges.subscribe(() => {
          if (newPasswordControl.value) {
            this.changePasswordForm.updateValueAndValidity()
          }
        })
      }
    }
  }

  private initForm(): void {
    if (!this.currentPasswordValidated) {
      this.changePasswordForm = this.fb.group({
        currentPassword: ['', [Validators.required]],
      })
    } else {
      this.changePasswordForm = this.fb.group(
        {
          newPassword: ['', [Validators.required]],
          confirmPassword: ['', [Validators.required]],
        },
        { validators: this.passwordMatchValidator }
      )

      setTimeout(() => this.setupFormListeners(), 0)
    }
  }

  private passwordMatchValidator(form: any) {
    const newPassword = form.get('newPassword')
    const confirmPassword = form.get('confirmPassword')

    if (newPassword && confirmPassword) {
      if (
        newPassword.value &&
        confirmPassword.value &&
        newPassword.value !== confirmPassword.value
      ) {
        confirmPassword.setErrors({ passwordMismatch: true })
        return { passwordMismatch: true }
      } else if (
        newPassword.value === confirmPassword.value &&
        confirmPassword.errors?.['passwordMismatch']
      ) {
        delete confirmPassword.errors['passwordMismatch']
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null)
        }
      }
    }
    return null
  }

  togglePasswordVisibility(field: string): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword
        break
      case 'new':
        this.showNewPassword = !this.showNewPassword
        break
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword
        break
    }
  }

  validateCurrentPassword(): void {
    if (this.changePasswordForm.get('currentPassword')?.valid) {
      this.isValidatingCurrentPassword = true

      const currentPassword =
        this.changePasswordForm.get('currentPassword')?.value

      this.userService.validateCurrentPassword(currentPassword).subscribe({
        next: (response: any) => {
          this.isValidatingCurrentPassword = false
          this.currentPasswordValidated = true
          this.currentPasswordValue = currentPassword
          this.notificationService.showNotification({
            type: 'success',
            message: 'Contraseña actual validada correctamente',
          })

          this.initForm()
        },
        error: (error: any) => {
          this.isValidatingCurrentPassword = false
          let errorMessage = 'Contraseña actual incorrecta'
          if (error.error?.data?.error) {
            errorMessage = error.error.data.error
          } else if (error.error?.message) {
            errorMessage = error.error.message
          }

          this.notificationService.showNotification({
            type: 'error',
            message: errorMessage,
          })
        },
      })
    } else {
      this.changePasswordForm.get('currentPassword')?.markAsTouched()
    }
  }

  resetPasswordChange(): void {
    this.currentPasswordValidated = false
    this.currentPasswordValue = ''
    this.initForm()
  }

  onSubmit(): void {
    if (!this.currentPasswordValidated) {
      this.validateCurrentPassword()
    } else {
      if (this.changePasswordForm.valid) {
        this.isLoading = true

        const { newPassword } = this.changePasswordForm.value

        this.userService
          .changePassword({
            currentPassword: this.currentPasswordValue,
            newPassword,
          })
          .subscribe({
            next: (response: any) => {
              this.isLoading = false
              this.notificationService.showNotification({
                type: 'success',
                message: response.message || 'Contraseña cambiada exitosamente',
              })
              this.currentPasswordValidated = false
              this.currentPasswordValue = ''
              this.initForm()
            },
            error: (error: any) => {
              this.isLoading = false
              let errorMessage = 'Error al cambiar la contraseña'
              if (error.error?.data?.error) {
                errorMessage = error.error.data.error
              } else if (error.error?.message) {
                errorMessage = error.error.message
              }

              this.notificationService.showNotification({
                type: 'error',
                message: errorMessage,
              })
            },
          })
      } else {
        this.markFormGroupTouched()
      }
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.changePasswordForm.controls).forEach((key) => {
      const control = this.changePasswordForm.get(key)
      control?.markAsTouched()
    })
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.changePasswordForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  getFieldError(fieldName: string): string {
    const field = this.changePasswordForm.get(fieldName)
    if (field && field.errors) {
      if (field.errors['required']) {
        if (fieldName === 'currentPassword') {
          return 'La contraseña actual es requerida'
        } else if (fieldName === 'newPassword') {
          return 'La nueva contraseña es requerida'
        } else if (fieldName === 'confirmPassword') {
          return 'Confirmar la contraseña es requerido'
        }
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden'
      }
    }
    return ''
  }
}
