// src/app/core/components/auth-layout/auth-layout.component.ts

import { Component, inject, Renderer2, OnDestroy, OnInit } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { LogoComponent } from '../logo/logo.component'
import { credits, currentYear } from '@core/helpers/ui/constants'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import {
  languages,
  languageToFlagMap,
} from '@core/helpers/global/language-data'
import { change } from '@core/states/language/language.actions'
import { Store } from '@ngrx/store'
import { AVAILABLE_LANGUAGES } from '@core/helpers/global/global.constants'
import { LanguageComponent } from '@core/interfaces/ui/language.interface'

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LogoComponent,
    TranslateModule,
    NgbDropdownModule,
  ],
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss'],
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  languageList = languages
  languageToFlagMap = languageToFlagMap

  private renderer = inject(Renderer2)
  translate = inject(TranslateService)

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'h-100')

    const savedLanguage = localStorage.getItem('preferredLanguage') || 'es'
    this.translate.setDefaultLang('en')
    this.translate.use(savedLanguage)
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'h-100')
  }

  changeLanguage(language: LanguageComponent): void {
    this.translate.use(language.code)
    this.store.dispatch(change({ language: language.code }))
    localStorage.setItem('preferredLanguage', language.code)
  }
}
