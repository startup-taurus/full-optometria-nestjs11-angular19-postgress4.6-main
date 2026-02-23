import { Component, inject, OnInit } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { TranslatePipe } from '@ngx-translate/core'
import { AuthenticationService } from '@core/services/api/auth.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'

@Component({
  selector: 'forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup
  isLoading = false
  emailSent = false

  private fb = inject(FormBuilder)
  private authService = inject(AuthenticationService)
  private notificationService = inject(ToastrNotificationService)
  private router = inject(Router)

  ngOnInit(): void {
    this.initForm()
  }

  private initForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    })
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true
      const email = this.forgotPasswordForm.value.email

      this.authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.isLoading = false
          this.emailSent = true
          this.notificationService.showNotification({
            type: 'success',
            message:
              response.message ||
              'Se ha enviado un enlace de restablecimiento a tu correo electrónico',
          })
        },
        error: (error) => {
          this.isLoading = false
          let errorMessage = 'Error al procesar la solicitud'
          
          if (error.error?.message) {
            errorMessage = error.error.message
          } else if (error.message) {
            errorMessage = error.message
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

  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach((key) => {
      const control = this.forgotPasswordForm.get(key)
      control?.markAsTouched()
    })
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  backToLogin(): void {
    this.router.navigate(['/auth/login'])
  }

  resendEmail(): void {
    this.emailSent = false
    this.onSubmit()
  }
}
