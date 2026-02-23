import { APP_INITIALIZER } from '@angular/core'
import { ThemeCustomizerService } from '../services/ui/theme-customizer.service'

export const themeCustomizerInitializer = {
  provide: APP_INITIALIZER,
  useFactory: (themeService: ThemeCustomizerService) => () => {
    themeService['loadSavedColor']()
  },
  deps: [ThemeCustomizerService],
  multi: true,
}
