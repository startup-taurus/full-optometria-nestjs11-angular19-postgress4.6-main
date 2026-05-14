import { Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import {
  ThemeCustomizerService,
  ThemeColor,
} from '@core/services/ui/theme-customizer.service'
import { languages, languageToFlagMap } from '../layouts/topbar/data'
import { Store } from '@ngrx/store'
import { changetheme } from '@core/states/layout/layout-action'
import type { LayoutState } from '@core/states/layout/layout-reducers'
import { GlobalService } from '@core/services/ui/global.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { Clipboard } from '@angular/cdk/clipboard'

@Component({
  selector: 'app-theme-customizer',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './theme-customizer.component.html',
  styleUrls: ['./theme-customizer.component.scss'],
})
export class ThemeCustomizerComponent implements OnInit {
  public isOpen = false
  public availableColors: ThemeColor[] = []
  public selectedColor: ThemeColor | null = null
  public selectedMode: 'light' | 'dark' = 'light'
  public languageList = languages
  public readonly languageToFlagMap = languageToFlagMap
  public companySlug: string = ''

  private themeService = inject(ThemeCustomizerService)
  public translate = inject(TranslateService)
  private store = inject(Store)
  private profileService = inject(GlobalService)
  private clipboard = inject(Clipboard)
  private notificationService = inject(ToastrNotificationService)

  ngOnInit(): void {
    this.availableColors = this.themeService.availableColors

    this.themeService.currentColor$.subscribe((color) => {
      this.selectedColor = color
    })

    this.themeService.panelOpen$.subscribe((isOpen) => {
      this.isOpen = isOpen
    })

    this.store.select('layout').subscribe((layout: LayoutState) => {
      this.selectedMode = layout.LAYOUT_THEME === 'dark' ? 'dark' : 'light'
    })

    this.profileService.profile.subscribe((user) => {
      this.companySlug = user.company?.slug || ''
    })
  }

  public togglePanel(): void {
    this.themeService.togglePanel()
  }

  public closePanel(): void {
    this.themeService.closePanel()
  }

  public selectColor(color: ThemeColor): void {
    this.themeService.applyThemeColor(color, true)
  }

  public isColorSelected(color: ThemeColor): boolean {
    return this.selectedColor?.name === color.name
  }

  public changeMode(mode: 'light' | 'dark'): void {
    this.selectedMode = mode
    this.store.dispatch(changetheme({ color: mode }))
    document.documentElement.setAttribute('data-bs-theme', mode)
  }

  public isModeSelected(mode: 'light' | 'dark'): boolean {
    return this.selectedMode === mode
  }

  public changeLanguage(language: string): void {
    this.translate.use(language)
    localStorage.setItem('preferredLanguage', language)
  }

  public getCurrentLanguage(): string {
    return this.translate.currentLang || 'en'
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

  public resetToDefaults(): void {
    this.themeService.resetToDefault()
    this.changeMode('light')
    this.translate.use('es')
    localStorage.setItem('preferredLanguage', 'es')
  }
}
