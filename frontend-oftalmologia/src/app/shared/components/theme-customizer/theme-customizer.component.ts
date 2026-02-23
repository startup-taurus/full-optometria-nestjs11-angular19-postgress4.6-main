import { Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import {
  ThemeCustomizerService,
  ThemeColor,
} from '@core/services/ui/theme-customizer.service'
import { languages, languageToFlagMap } from '../layouts/topbar/data'

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
  public languageList = languages
  public readonly languageToFlagMap = languageToFlagMap

  private themeService = inject(ThemeCustomizerService)
  public translate = inject(TranslateService)

  ngOnInit(): void {
    this.availableColors = this.themeService.availableColors

    this.themeService.currentColor$.subscribe((color) => {
      this.selectedColor = color
    })

    this.themeService.panelOpen$.subscribe((isOpen) => {
      this.isOpen = isOpen
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

  public changeLanguage(language: string): void {
    this.translate.use(language)
    localStorage.setItem('preferredLanguage', language)
  }

  public getCurrentLanguage(): string {
    return this.translate.currentLang || 'en'
  }

  public resetToDefaults(): void {
    this.themeService.resetToDefault()
    this.translate.use('es')
    localStorage.setItem('preferredLanguage', 'es')
  }
}
