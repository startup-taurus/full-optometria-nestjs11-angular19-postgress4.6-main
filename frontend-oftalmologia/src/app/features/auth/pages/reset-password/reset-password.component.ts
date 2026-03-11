import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '@core/services/api/auth.service';
import { ToastrNotificationService } from '@core/services/ui/notification.service';

@Component({
  selector: 'reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  isLoading = false;
  token: string | null = null;
  passwordReset = false;
  showNewPassword = false;
  showConfirmPassword = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthenticationService);
  private notificationService = inject(ToastrNotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.notificationService.showNotification({
        type: 'error',
        message: 'Token inválido o faltante'
      });
      this.router.navigate(['/auth/login']);
      return;
    }
    this.initForm();
  }

  private initForm(): void {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: any) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(field: string): void {
    if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && this.token) {
      this.isLoading = true;
      const newPassword = this.resetPasswordForm.value.newPassword;

      this.authService.resetPassword(this.token, newPassword).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.passwordReset = true;
          this.notificationService.showNotification({
            type: 'success',
            message: response.message || 'Contraseña restablecida exitosamente'
          });
        },
        error: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resetPasswordForm.controls).forEach(key => {
      const control = this.resetPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.resetPasswordForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `AUTH.ERRORS.${fieldName.toUpperCase()}_REQUIRED`;
      }
      if (field.errors['minlength']) {
        return 'AUTH.ERRORS.PASSWORD_MIN_LENGTH';
      }
      if (field.errors['passwordMismatch']) {
        return 'AUTH.ERRORS.PASSWORD_MISMATCH';
      }
    }
    return '';
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
