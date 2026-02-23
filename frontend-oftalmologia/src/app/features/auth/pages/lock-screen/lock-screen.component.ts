import { CommonModule } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { Router } from '@angular/router'
import {
  User,
  UserLoginRequest,
  UserState,
} from '@core/interfaces/api/user.interface'
import { AuthenticationService } from '@core/services/api/auth.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { UserActions } from '@core/states/auth/auth.actions'
import { selectAuth } from '@core/states/auth/auth.selectors'
import { environment } from '@environment/environment'
import { Store } from '@ngrx/store'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { ToastrService } from 'ngx-toastr'
import { Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'lock-screen',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslatePipe],
  templateUrl: './lock-screen.component.html',
})
export class LockScreenComponent implements OnInit {
  public userProfile!: User
  public unlockForm!: FormGroup
  private onDestroy$: Subject<boolean> = new Subject()
  public isLoading: boolean = false
  public userImage: string = ''

  private fileBaseUrl: string = environment.fileBaseUrl
  private translate = inject(TranslateService)
  private _store = inject(Store)
  private toastr = inject(ToastrService)
  private notificationService = inject(ToastrNotificationService)
  private _fb = inject(FormBuilder)
  private _authService = inject(AuthenticationService)
  private _router = inject(Router)

  ngOnInit(): void {
    this.initForm()
    this.getProfile()
  }

  private getProfile(): void {
    this._store
      .select(selectAuth)
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((state: UserState) => {
        if (state.user) {
          this.setUserProfile(state.user)
        } else {
          this.recoverLockedUserData()
        }
      })
  }

  private setUserProfile(user: User): void {
    this.userProfile = user
    this.userImage = user.profilePhoto
      ? this.formatUrl(user.profilePhoto)
      : 'assets/images/default-avatar.png'
  }

  private recoverLockedUserData(): void {
    const lockedUser = this._authService.getLockedUserData()

    if (lockedUser) {
      this.setUserProfile(lockedUser)
    } else {
      this.notificationService.showNotification({
        type: 'warning',
        message: 'inicie sesión nuevamente.',
      })
      this._router.navigate(['/auth/login'])
    }
  }

  private formatUrl(url?: string): string {
    if (!url) {
      return 'assets/images/default-avatar.png'
    }

    let cleanUrl = url.replace('/uploads/uploads/', '/uploads/')

    if (cleanUrl.startsWith('/')) {
      return (
        this.fileBaseUrl + cleanUrl.replace(/ /g, '%20').replace(/\\/g, '/')
      )
    }
    return (
      this.fileBaseUrl + '/' + cleanUrl.replace(/ /g, '%20').replace(/\\/g, '/')
    )
  }

  private initForm(): void {
    this.unlockForm = this._fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
    })
  }

  unlockSession(): void {
    if (this.unlockForm.valid && this.userProfile) {
      const data: UserLoginRequest = {
        identifier: this.userProfile.email,
        password: this.unlockForm.get('password')?.value,
      }

      if (data) {
        this.isLoading = true
        this._authService.unlockScreen(data).subscribe(
          (res) => {
            this.isLoading = false
            this._authService.unlockSession()
            this._router.navigate(['/dashboard'])
            this.notificationService.showNotification({
              type: 'success',
              message: res.message,
            })
          },
          (error) => {
            this.notificationService.showNotification({
              type: 'error',
              message:
                error.error?.message ||
                error.message ||
                'Error al desbloquear la pantalla',
            })
            this.isLoading = false
          }
        )
      }
    } else if (!this.userProfile) {
      this.notificationService.showNotification({
        type: 'error',
        message: 'Redirigiendo al login',
      })
      setTimeout(() => {
        this._router.navigate(['/auth/login'])
      }, 2000)
    } else {
      const warningMsg = this.translate.instant(
        'LOGIN.MESSAGES.FORM_INCOMPLETE'
      )
      this.notificationService.showNotification({
        type: 'warning',
        message: warningMsg,
      })
    }
  }

  goToLogin(): void {
    this._authService.logout()
    this._router.navigate(['/auth/login'])
  }

  ngOnDestroy(): void {
    this.onDestroy$.next(true)
  }
}
