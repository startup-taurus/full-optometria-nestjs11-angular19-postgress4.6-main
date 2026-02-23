import { Injectable } from '@angular/core'
import { Store } from '@ngrx/store'
import { BehaviorSubject, catchError, filter, of, tap } from 'rxjs'
import { LanguageCode } from '../../interfaces/ui/language.interface'
import { AVAILABLE_LANGUAGES, LOCAL_STORAGE_NAMES } from '@core/helpers/global/global.constants'
import { selectLanguage } from '@core/states/language/language.selectors'
import { AppState } from '@core/states'

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  public code: BehaviorSubject<LanguageCode> =
    new BehaviorSubject<LanguageCode>(this.getInitialLanguage())

  constructor(private _store: Store<AppState>) {
    this.initializeLanguage()
  }

  private getInitialLanguage(): LanguageCode {
    const saved = localStorage.getItem(LOCAL_STORAGE_NAMES.LANGUAGE)
    return (saved as LanguageCode) || AVAILABLE_LANGUAGES.ES
  }

  private initializeLanguage(): void {
    this._store
      .select(selectLanguage)
      .pipe(
        filter((language) => !!language),
        tap((language) => this.code.next(language)),
        catchError(() => {
          const fallback = this.getInitialLanguage()
          this.code.next(fallback)
          return of(fallback)
        })
      )
      .subscribe()
  }
}
