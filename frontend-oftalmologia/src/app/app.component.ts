import {
  Component,
  inject,
  ViewChild,
  type OnInit,
} from '@angular/core'
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
  type Event,
} from '@angular/router'
import { SessionTimeoutService } from '@core/services/ui/session-timeout.service'
import { TitleService } from '@core/services/ui/title.service'
import { UserActions } from '@core/states/auth/auth.actions'
import { loadPreviewLanguage } from '@core/states/language/language.actions'
import { selectLanguage } from '@core/states/language/language.selectors'
import { Store } from '@ngrx/store'
import { TranslateService } from '@ngx-translate/core'
import {
  NgProgressComponent,
  NgProgressModule,
  type NgProgressRef,
} from 'ngx-progressbar'
import { CompanyLogoService } from '@core/services/ui/company-logo.service'
import { selectUser } from '@core/states/auth/auth.selectors'
import { take } from 'rxjs/operators'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgProgressModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private titleService = inject(TitleService)
  private companyLogoService = inject(CompanyLogoService)
  progressRef!: NgProgressRef
  @ViewChild(NgProgressComponent) progressBar!: NgProgressComponent
  public language$ = this.store.select(selectLanguage)

  private router = inject(Router)
  private sessionTimeoutService = inject(SessionTimeoutService)

  constructor(
    private translate: TranslateService,
    private store: Store
  ) {
    this.store.dispatch(UserActions.loadUserSession())
    this.store.dispatch(loadPreviewLanguage())
    this.language$.subscribe((language) => {
      this.translate.use(language)
    })

    this.initializeSplashScreenLogo()
  }

  ngOnInit(): void {
    this.titleService.init()
  }

  private initializeSplashScreenLogo(): void {
    const pathname = window.location.pathname
    const isPublicRoute = /^\/(catalog|auth)/.test(pathname) || pathname === '/'
    
    if (isPublicRoute) {
      return
    }
    
    const splashImage = document.querySelector('#splash-logo') as HTMLImageElement | null
    const splashScreen = document.querySelector('#splash-screen') as HTMLElement | null

    if (!splashImage || !splashScreen) {
      return
    }

    const cachedLogo = this.companyLogoService.getCachedLogoUrl()
    if (cachedLogo) {
      splashImage.src = cachedLogo
    } else {
      const defaultLogo = this.companyLogoService.getDefaultLogo()
      splashImage.src = defaultLogo
      this.companyLogoService.cacheLogoUrl(defaultLogo)
    }

    let splashHidden = false
    const hideSplash = (delay = 300) => {
      if (splashHidden) {
        return
      }
      splashHidden = true
      setTimeout(() => splashScreen.classList.add('remove'), delay)
    }

    let logoResolved = false

    this.store.select(selectUser).subscribe((user) => {
      if (!splashImage || !splashScreen || logoResolved) {
        return
      }

      if (user?.company?.logoFile?.path) {
        this.companyLogoService
          .getCompanyLogoUrl$()
          .pipe(take(1))
          .subscribe((logoUrl) => {
            logoResolved = true
            splashImage.src = logoUrl
            this.companyLogoService.cacheLogoUrl(logoUrl)

            if (splashImage.complete) {
              hideSplash()
            } else {
              splashImage.onload = () => hideSplash()
              splashImage.onerror = () => {
                const defaultLogo = this.companyLogoService.getDefaultLogo()
                splashImage.src = defaultLogo
                this.companyLogoService.cacheLogoUrl(defaultLogo)
                hideSplash()
              }
            }
          })
      } else if (user) {
        logoResolved = true
        const defaultLogo = this.companyLogoService.getDefaultLogo()
        splashImage.src = defaultLogo
        this.companyLogoService.cacheLogoUrl(defaultLogo)
        hideSplash()
      }
    })

    setTimeout(() => hideSplash(), 2500)
  }
}
