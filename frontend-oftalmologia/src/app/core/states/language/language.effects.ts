import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { TranslateService } from '@ngx-translate/core'
import { exhaustMap, of } from 'rxjs'
import {
  loadPreviewLanguage,
  loadPreviewLanguageSuccess,
} from './language.actions'
import {
  AVAILABLE_LANGUAGES,
  LOCAL_STORAGE_NAMES,
} from '@core/helpers/global/global.constants'
import { LanguageCode } from '@core/interfaces/ui/language.interface'

@Injectable()
export class LanguageEffects {
  constructor(
    private actions$: Actions,
    private translate: TranslateService
  ) {}

  loadPreviewLanguage = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPreviewLanguage),
      exhaustMap(() => {
        let selectedLanguage: LanguageCode = AVAILABLE_LANGUAGES.ES
        const localStorageData = localStorage.getItem(
          LOCAL_STORAGE_NAMES.LANGUAGE
        )

        if (
          localStorageData &&
          Object.values(AVAILABLE_LANGUAGES).includes(
            localStorageData as LanguageCode
          )
        ) {
          selectedLanguage = localStorageData as LanguageCode
        }

        localStorage.setItem(LOCAL_STORAGE_NAMES.LANGUAGE, selectedLanguage)
        this.translate.setDefaultLang(selectedLanguage)
        this.translate.use(selectedLanguage)

        return of(
          loadPreviewLanguageSuccess({
            language: selectedLanguage,
          })
        )
      })
    )
  )
}
