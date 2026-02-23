import { Pipe, PipeTransform, inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

@Pipe({
  name: 'formatValue',
  standalone: true,
  pure: false
})
export class FormatValuePipe implements PipeTransform {
  private _translateService = inject(TranslateService)

  transform(
    value: any,
    type: 'date' | 'age' | 'na' | 'default' = 'default',
    dateFormat: 'short' | 'medium' | 'long' = 'short'
  ): string {
    if (value === null || value === undefined || value === '') {
      return this._translateService.instant('MEDICAL_HISTORY.FIELDS.NOT_AVAILABLE')
    }

    switch (type) {
      case 'date':
        return this.formatDate(value, dateFormat)
      case 'age':
        return this.formatAge(value)
      case 'na':
        return value ? String(value) : this._translateService.instant('MEDICAL_HISTORY.FIELDS.NOT_AVAILABLE')
      default:
        return value ? String(value) : this._translateService.instant('MEDICAL_HISTORY.FIELDS.NOT_AVAILABLE')
    }
  }

  private formatDate(value: any, format: 'short' | 'medium' | 'long'): string {
    try {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        return this._translateService.instant('MEDICAL_HISTORY.FIELDS.NOT_AVAILABLE')
      }

      const currentLang = this._translateService.currentLang || 'es'
      const locale = currentLang === 'es' ? 'es-ES' : 'en-US'

      switch (format) {
        case 'short':
          return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
        case 'medium':
          return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        case 'long':
          return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        default:
          return date.toLocaleDateString(locale)
      }
    } catch {
      return this._translateService.instant('MEDICAL_HISTORY.FIELDS.NOT_AVAILABLE')
    }
  }

  private formatAge(value: any): string {
    if (!value || isNaN(Number(value))) {
      return this._translateService.instant('MEDICAL_HISTORY.FIELDS.NOT_AVAILABLE')
    }

    const age = Number(value)
    const yearsLabel = this._translateService.instant('MEDICAL_HISTORY.FIELDS.YEARS')
    return `${age} ${yearsLabel}`
  }
}