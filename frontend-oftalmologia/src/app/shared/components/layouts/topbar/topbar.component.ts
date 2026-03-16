import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  AfterViewInit,
  inject,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterLink } from '@angular/router'
import { Store } from '@ngrx/store'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import {
  NgbDropdownModule,
  NgbModal,
  NgbModalModule,
  NgbOffcanvasModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap'
import { SimplebarAngularModule } from 'simplebar-angular'

import { splitArray } from '@core/helpers/ui/utils'
import { currency } from '@core/helpers/ui/constants'
import { appData, languages, languageToFlagMap } from './data'

import { User } from '@core/interfaces/api/user.interface'
import { GlobalService } from '@core/services/ui/global.service'
import { ThemeCustomizerService } from '@core/services/ui/theme-customizer.service'
import { PERMISSIONS } from '@core/constants/permissions.constants'
import { ToastrNotificationService } from '@core/services/ui/notification.service'

import type { LayoutState } from '@core/states/layout/layout-reducers'
import { changetheme } from '@core/states/layout/layout-action'
import { UserActions } from '@core/states/auth/auth.actions'

import { LogoComponent } from '../logo/logo.component'
import { BranchSelectorComponent } from '../../branch-selector/branch-selector.component'
import { environment } from '@environment/environment'
import { HasPermissionIdDirective } from '../../../directives/has-permission-id.directive'
import { Clipboard } from '@angular/cdk/clipboard'
import { ClipboardModule } from '@angular/cdk/clipboard'

@Component({
  selector: 'app-topbar',
  standalone: true,
  templateUrl: './topbar.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    NgbOffcanvasModule,
    NgbDropdownModule,
    NgbTooltipModule,
    SimplebarAngularModule,
    NgbModalModule,
    RouterLink,
    LogoComponent,
    BranchSelectorComponent,
    TranslateModule,
    HasPermissionIdDirective,
    ClipboardModule,
  ],
  styles: ``,
})
export class TopbarComponent implements OnInit, AfterViewInit {
  public userProfile!: User
  public currency = currency
  public languageList = languages
  public appsChunks = splitArray(appData, 3)
  public color!: string
  public readonly languageToFlagMap = languageToFlagMap
  private fileBaseUrl: string = environment.fileBaseUrl
  public userImage: string = ''
  public permissions = PERMISSIONS

  @Output() settingsButtonClicked = new EventEmitter<void>()
  @Output() mobileMenuButtonClicked = new EventEmitter<void>()

  private modalService = inject(NgbModal)
  private store = inject(Store)
  public translate = inject(TranslateService)
  private profileService = inject(GlobalService)
  private router = inject(Router)
  private themeCustomizerService = inject(ThemeCustomizerService)
  private clipboard = inject(Clipboard)
  private notificationService = inject(ToastrNotificationService)

  public companySlug: string = ''

  ngOnInit(): void {
    this.initializeLanguage()
    this.getProfile()
    this.getLayoutTheme()
  }

  ngAfterViewInit(): void {}

  private getProfile(): void {
    this.profileService.profile.subscribe((user) => {
      this.userProfile = user
      this.userImage = user.profilePhoto
        ? this.formatUrl(user.profilePhoto)
        : 'assets/images/default-avatar.png'
      this.companySlug = user.company?.slug || ''
    })
  }

  public copyCompanyUrl(): void {
    if (!this.companySlug) return
    const url = `https://optometria.zgameslatam.com/catalog/${this.companySlug}`
    const success = this.clipboard.copy(url)
    if (success) {
      this.notificationService.showNotification({
        title: this.translate.instant('COMPANIES_MODULE.COPY_URL'),
        message: this.translate.instant('COMPANIES_MODULE.URL_COPIED'),
        type: 'success',
      })
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

  private initializeLanguage(): void {
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'en'
    this.translate.setDefaultLang('en')
    this.translate.use(savedLanguage)
  }

  private getLayoutTheme(): void {
    this.store.select('layout').subscribe((data: LayoutState) => {
      this.color = data.LAYOUT_THEME
    })
  }

  open(content: TemplateRef<any>): void {
    this.modalService.open(content, { size: 'lg' })
  }

  settingMenu(): void {
    this.settingsButtonClicked.emit()
  }

  toggleMobileMenu(): void {
    this.mobileMenuButtonClicked.emit()
  }

  changeTheme(): void {
    const newTheme = this.color === 'dark' ? 'light' : 'dark'

    this.color = newTheme
    this.store.dispatch(changetheme({ color: newTheme }))
    document.documentElement.setAttribute('data-bs-theme', newTheme)
  }

  changeLanguage(language: string): void {
    this.translate.use(language)
    localStorage.setItem('preferredLanguage', language)
  }

  logout(): void {
    this.store.dispatch(UserActions.userLogout())
  }

  toggleThemeCustomizer(): void {
    this.themeCustomizerService.togglePanel()
  }
}
