import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

export interface ThemeColor {
  name: string
  displayName: string
  hex: string
  rgb: string
}

@Injectable({
  providedIn: 'root',
})
export class ThemeCustomizerService {
  private readonly STORAGE_KEY = 'app-theme-color'
  private readonly THEME_OVERRIDE_KEYS: string[] = [
    '--app-primary',
    '--app-primary-rgb',
    '--bs-primary',
    '--bs-primary-rgb',
    '--bs-primary-50',
    '--bs-primary-100',
    '--bs-primary-200',
    '--bs-primary-300',
    '--bs-primary-400',
    '--bs-primary-500',
    '--bs-primary-600',
    '--bs-primary-700',
    '--bs-primary-800',
    '--bs-primary-900',
    '--bs-primary-text-emphasis',
    '--bs-primary-bg-subtle',
    '--bs-primary-border-subtle',
    '--bs-secondary',
    '--bs-secondary-rgb',
    '--bs-btn-bg',
    '--bs-btn-border-color',
    '--bs-btn-hover-bg',
    '--bs-btn-hover-border-color',
    '--bs-btn-active-bg',
    '--bs-btn-active-border-color',
    '--bs-btn-disabled-bg',
    '--bs-btn-disabled-border-color',
    '--bs-link-color',
    '--bs-link-hover-color',
    '--osen-topbar-bg',
    '--osen-topbar-item-color',
    '--osen-topbar-item-hover-color',
    '--osen-topbar-search-bg',
    '--osen-topbar-user-bg',
    '--osen-topbar-user-border',
    '--osen-menu-item-active-bg',
    '--osen-menu-item-active-color',
  ]

  public readonly availableColors: ThemeColor[] = [
    {
      name: 'light-blue',
      displayName: 'Azul Cielo',
      hex: '#60BDD6',
      rgb: '96, 189, 214',
    },
    { name: 'blue', displayName: 'Azul', hex: '#465DFF', rgb: '70, 93, 255' },
    {
      name: 'indigo',
      displayName: 'Índigo',
      hex: '#6B5EAE',
      rgb: '107, 94, 174',
    },
    {
      name: 'purple',
      displayName: 'Púrpura',
      hex: '#214178',
      rgb: '33, 65, 120',
    },
    { name: 'pink', displayName: 'Rosa', hex: '#FF679B', rgb: '255, 103, 155' },
    { name: 'red', displayName: 'Rojo', hex: '#FF6D43', rgb: '255, 109, 67' },
    {
      name: 'orange',
      displayName: 'Naranja',
      hex: '#FD7E14',
      rgb: '253, 126, 20',
    },
    {
      name: 'yellow',
      displayName: 'Amarillo',
      hex: '#F9C45C',
      rgb: '249, 196, 92',
    },
    {
      name: 'green',
      displayName: 'Verde',
      hex: '#6AC75A',
      rgb: '106, 199, 90',
    },
    {
      name: 'teal',
      displayName: 'Verde Azulado',
      hex: '#02BC9C',
      rgb: '2, 188, 156',
    },
    {
      name: 'magenta',
      displayName: 'Magenta',
      hex: '#FF00FF',
      rgb: '255, 0, 255',
    },
    { name: 'lime', displayName: 'Lima', hex: '#00FF00', rgb: '0, 255, 0' },
    {
      name: 'brown',
      displayName: 'Marrón',
      hex: '#A52A2A',
      rgb: '165, 42, 42',
    },
    {
      name: 'navy',
      displayName: 'Azul Marino',
      hex: '#000080',
      rgb: '0, 0, 128',
    },
    { name: 'olive', displayName: 'Oliva', hex: '#808000', rgb: '128, 128, 0' },
    {
      name: 'maroon',
      displayName: 'Granate',
      hex: '#800000',
      rgb: '128, 0, 0',
    },
    { name: 'gold', displayName: 'Oro', hex: '#FFD700', rgb: '255, 215, 0' },
    {
      name: 'violet',
      displayName: 'Violeta',
      hex: '#8A2BE2',
      rgb: '138, 43, 226',
    },
    {
      name: 'lavender',
      displayName: 'Lavanda',
      hex: '#E6E6FA',
      rgb: '230, 230, 250',
    },
    { name: 'black', displayName: 'Negro', hex: '#000000', rgb: '0, 0, 0' },
  ]

  private currentColorSubject = new BehaviorSubject<ThemeColor>(
    this.availableColors[0]
  )
  public currentColor$ = this.currentColorSubject.asObservable()

  private panelOpenSubject = new BehaviorSubject<boolean>(false)
  public panelOpen$ = this.panelOpenSubject.asObservable()

  constructor() {}

  public togglePanel(): void {
    const currentState = this.panelOpenSubject.value
    this.panelOpenSubject.next(!currentState)
  }

  public closePanel(): void {
    this.panelOpenSubject.next(false)
  }

  public loadSavedColor(): void {
    const savedColorName = localStorage.getItem(this.STORAGE_KEY)
    if (savedColorName) {
      const savedColor = this.availableColors.find(
        (c) => c.name === savedColorName
      )
      if (savedColor) {
        this.applyThemeColor(savedColor, false)
        return
      }
    }
    this.applyThemeColor(this.availableColors[0], false)
  }

  public applySavedColorForInternalContext(): void {
    this.loadSavedColor()
  }

  public resetToBaseTheme(): void {
    this.applyThemeColor(this.availableColors[0], false)
  }

  public applyThemeColor(color: ThemeColor, save: boolean = true): void {
    const root = document.documentElement

    root.style.setProperty('--app-primary', color.hex)
    root.style.setProperty('--app-primary-rgb', color.rgb)

    root.style.setProperty('--bs-primary', color.hex)
    root.style.setProperty('--bs-primary-rgb', color.rgb)

    root.style.setProperty('--bs-primary-50', this.tintColor(color.hex, 95))
    root.style.setProperty('--bs-primary-100', this.tintColor(color.hex, 85))
    root.style.setProperty('--bs-primary-200', this.tintColor(color.hex, 70))
    root.style.setProperty('--bs-primary-300', this.tintColor(color.hex, 50))
    root.style.setProperty('--bs-primary-400', this.tintColor(color.hex, 30))
    root.style.setProperty('--bs-primary-500', color.hex)
    root.style.setProperty('--bs-primary-600', this.shadeColor(color.hex, 10))
    root.style.setProperty('--bs-primary-700', this.shadeColor(color.hex, 20))
    root.style.setProperty('--bs-primary-800', this.shadeColor(color.hex, 30))
    root.style.setProperty('--bs-primary-900', this.shadeColor(color.hex, 40))

    root.style.setProperty(
      '--bs-primary-text-emphasis',
      this.shadeColor(color.hex, 15)
    )
    root.style.setProperty(
      '--bs-primary-bg-subtle',
      this.tintColor(color.hex, 85)
    )
    root.style.setProperty(
      '--bs-primary-border-subtle',
      this.tintColor(color.hex, 60)
    )

    root.style.setProperty('--bs-secondary', this.availableColors[2].hex)
    root.style.setProperty('--bs-secondary-rgb', this.availableColors[2].rgb)

    root.style.setProperty('--bs-btn-bg', color.hex)
    root.style.setProperty('--bs-btn-border-color', color.hex)
    root.style.setProperty('--bs-btn-hover-bg', this.shadeColor(color.hex, 9.5))
    root.style.setProperty(
      '--bs-btn-hover-border-color',
      this.shadeColor(color.hex, 7.5)
    )
    root.style.setProperty(
      '--bs-btn-active-bg',
      this.shadeColor(color.hex, 7.5)
    )
    root.style.setProperty(
      '--bs-btn-active-border-color',
      this.shadeColor(color.hex, 7.5)
    )
    root.style.setProperty('--bs-btn-disabled-bg', color.hex)
    root.style.setProperty('--bs-btn-disabled-border-color', color.hex)

    root.style.setProperty('--bs-link-color', color.hex)
    root.style.setProperty(
      '--bs-link-hover-color',
      this.shadeColor(color.hex, 15)
    )

    root.style.setProperty('--osen-topbar-bg', color.hex)
    root.style.setProperty('--osen-topbar-item-color', '#ffffff')
    root.style.setProperty('--osen-topbar-item-hover-color', '#ffffff')
    root.style.setProperty(
      '--osen-topbar-search-bg',
      this.adjustColor(color.hex, -10)
    )
    root.style.setProperty(
      '--osen-topbar-user-bg',
      this.adjustColor(color.hex, -5)
    )
    root.style.setProperty(
      '--osen-topbar-user-border',
      this.adjustColor(color.hex, -8)
    )

    root.style.setProperty('--osen-menu-item-active-bg', color.hex)
    root.style.setProperty('--osen-menu-item-active-color', '#ffffff')

    this.currentColorSubject.next(color)

    if (save) {
      localStorage.setItem(this.STORAGE_KEY, color.name)
    }
  }

  public getCurrentColor(): ThemeColor {
    return this.currentColorSubject.value
  }

  public resetToDefault(): void {
    this.applyThemeColor(this.availableColors[0], true)
  }

  private shadeColor(color: string, percent: number): string {
    return this.adjustColor(color, -Math.abs(percent))
  }

  private tintColor(color: string, percent: number): string {
    return this.adjustColor(color, Math.abs(percent))
  }

  private adjustColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = ((num >> 8) & 0x00ff) + amt
    const B = (num & 0x0000ff) + amt

    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
        .toUpperCase()
    )
  }
}
