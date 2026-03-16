import { routes } from '@/app/app.routes'
import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http'
import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
  APP_INITIALIZER,
} from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'
import { ERROR_INTERCEPTOR_PROVIDERS } from '@core/interceptors/error.interceptor'
import { RESPONSE_INTERCEPTOR_PROVIDERS } from '@core/interceptors/response.interceptor'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { StoreDevtoolsModule } from '@ngrx/store-devtools'
import { ToastrModule } from 'ngx-toastr'

import { HttpClient } from '@angular/common/http'
import { AUTH_TOKEN_INTERCEPTOR_PROVIDERS } from '@core/interceptors/auth-token.interceptor'
import { BRANCH_HEADER_INTERCEPTOR_PROVIDERS } from '@core/interceptors/branch-header.interceptor'
import { ROOT_EFFECTS, ROOT_REDUCERS } from '@core/states'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { DEFAULT_GLOBAL_TOASTR_CONFIG } from '@core/helpers/ui/ui.constants'
import { permissionsInitializerFactory } from '@core/initializers/permissions.initializer'
import { branchReduxInitializerFactory } from '@core/initializers/branch-redux.initializer'
import { localStorageSyncReducer } from '@core/states/layout/layout-reducers'
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap'

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json')
}

export function tooltipInitializerFactory(tooltipConfig: NgbTooltipConfig) {
  return () => {
    tooltipConfig.container = 'body'
    tooltipConfig.tooltipClass = 'table-tooltip'
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      BrowserAnimationsModule,
      BrowserModule,
      ToastrModule.forRoot(DEFAULT_GLOBAL_TOASTR_CONFIG),
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      }),
      StoreModule.forRoot(ROOT_REDUCERS, {
        metaReducers: [localStorageSyncReducer],
      }),
      EffectsModule.forRoot(ROOT_EFFECTS),
      StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: !isDevMode() })
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: permissionsInitializerFactory,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: branchReduxInitializerFactory,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: tooltipInitializerFactory,
      deps: [NgbTooltipConfig],
      multi: true,
    },
    AUTH_TOKEN_INTERCEPTOR_PROVIDERS,
    RESPONSE_INTERCEPTOR_PROVIDERS,
    BRANCH_HEADER_INTERCEPTOR_PROVIDERS,
    ERROR_INTERCEPTOR_PROVIDERS,
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
  ],
}
