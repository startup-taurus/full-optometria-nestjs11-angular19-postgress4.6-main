import { Component, inject, Renderer2, OnInit } from '@angular/core'
import { VerticalLayoutComponent } from '../vertical-layout/vertical-layout.component'
import { HorizontalLayoutComponent } from '../horizontal-layout/horizontal-layout.component'
import { Store } from '@ngrx/store'
import type { LayoutState } from '@core/states/layout/layout-reducers'
import { PermissionsService } from '@core/services/api/permissions.service'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'layout',
  standalone: true,
  imports: [
    VerticalLayoutComponent,
    HorizontalLayoutComponent,
    CommonModule,
    TranslateModule,
  ],
  templateUrl: './layout.component.html',
  styles: ``,
})
export class LayoutComponent implements OnInit {
  layoutType: LayoutState['LAYOUT'] = ''

  private store = inject(Store)
  private render = inject(Renderer2)
  public permissionsService = inject(PermissionsService)

  ngOnInit(): void {
    this.store.select('layout').subscribe((data: LayoutState) => {
      this.layoutType = data.LAYOUT
      this.render.setAttribute(
        document.documentElement,
        'data-bs-theme',
        data.LAYOUT_THEME
      )
      this.render.setAttribute(
        document.documentElement,
        'data-layout-mode',
        data.LAYOUT_MODE
      )
      this.render.setAttribute(
        document.documentElement,
        'data-menu-color',
        data.MENU_COLOR
      )
      this.render.setAttribute(
        document.documentElement,
        'data-topbar-color',
        data.TOPBAR_COLOR
      )
      this.render.setAttribute(
        document.documentElement,
        'data-sidenav-size',
        data.MENU_SIZE
      )
    })

    this.render.addClass(document.documentElement, 'menuitem-active')
  }

  /**
   * Check if the horizontal layout is requested
   */
  isHorizontalLayoutRequested() {
    return this.layoutType === 'horizontal'
  }

  isVerticalLayoutRequested() {
    return this.layoutType === 'vertical'
  }
}
