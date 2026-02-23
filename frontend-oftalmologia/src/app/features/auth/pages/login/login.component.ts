import { CommonModule } from '@angular/common'
import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  OnInit,
  inject,
} from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { Router } from '@angular/router'
import { currentYear } from '@core/helpers/ui/constants'
import {
  UserLoginRequest,
  UserState,
} from '@core/interfaces/api/user.interface'
import { AuthenticationService } from '@core/services/api/auth.service'
import { UserActions } from '@core/states/auth/auth.actions'
import { selectAuth } from '@core/states/auth/auth.selectors'
import { Store } from '@ngrx/store'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ToastrService } from 'ngx-toastr'
import { Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public errorMessage: string = ''
  public storedUsername: string | null = ''
  public storedPassword: string | null = ''

  public signInForm!: FormGroup
  public currentYear = currentYear

  public submitted = false
  public isLoading: boolean = false
  public showPassword: boolean = false
  public rememberMeChecked: boolean = false

  private onDestroy$: Subject<boolean> = new Subject()

  private store = inject(Store)
  private fb = inject(FormBuilder)
  private toastr = inject(ToastrService)
  private translate = inject(TranslateService)
  private authService = inject(AuthenticationService)
  private router = inject(Router)

  ngOnInit(): void {
    this.signInForm = this.fb.group({
      identifier: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    })
    const rememberedUser = this.authService.getRememberedUser()
    if (rememberedUser) {
      this.signInForm.patchValue({
        identifier: rememberedUser.identifier,
        password: rememberedUser.password,
        rememberMe: true,
      })
      this.rememberMeChecked = true
    }
  }

  get formValues() {
    return this.signInForm.controls
  }

  ngOnDestroy() {
    this.onDestroy$.next(true)
  }

  login(): void {
    this.submitted = true
    if (this.signInForm.valid) {
      const { identifier, password, rememberMe } = this.signInForm.value
      if (rememberMe) {
        this.authService.rememberUser(identifier, password)
      } else {
        this.authService.clearRememberedUser()
      }
      const data: UserLoginRequest = {
        identifier: this.signInForm.get('identifier')?.value,
        password: this.signInForm.get('password')?.value,
      }

      if (data) {
        this.isLoading = true
        this.store.dispatch(
          UserActions.userAuthenticationRequest({ request: data })
        )
        this.store
          .select(selectAuth)
          .pipe(takeUntil(this.onDestroy$))
          .subscribe((state: UserState) => {
            this.isLoading = state.loading
          })
      }
    } else {
      const warningMsg = this.translate.instant(
        'LOGIN.MESSAGES.FORM_INCOMPLETE'
      )
      this.toastr.warning(warningMsg, 'Warning')
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }

  rememberMe() {
    this.storedUsername = localStorage.getItem('public ')
    this.storedPassword = localStorage.getItem('remeberedPass')
    if (this.storedUsername && this.storedPassword) {
      this.signInForm.patchValue({ identifier: this.storedUsername })
      this.signInForm.patchValue({ password: this.storedPassword })
      this.rememberMeChecked = !this.rememberMeChecked
    }
  }

  onRememberMeChange() {
    if (this.rememberMeChecked) {
      this.rememberMeChecked = false
    } else {
      this.rememberMeChecked = true
    }
  }

  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password'])
  }

  goToCatalog(): void {
    const savedCompany = sessionStorage.getItem('catalog_company')

    if (savedCompany) {
      sessionStorage.removeItem('catalog_company')
      this.router.navigate(['/catalog', savedCompany])
    } else {
      this.router.navigate(['/catalog'])
    }
  }
}
