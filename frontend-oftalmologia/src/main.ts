import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import 'iconify-icon'

registerLocaleData(localeEs, 'es');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
