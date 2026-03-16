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

  private themeService = inject(ThemeCustomizerService)
  public translate = inject(TranslateService)
  private store = inject(Store)

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

  public resetToDefaults(): void {
    this.themeService.resetToDefault()
    this.changeMode('light')
    this.translate.use('es')
    localStorage.setItem('preferredLanguage', 'es')
  }
}
