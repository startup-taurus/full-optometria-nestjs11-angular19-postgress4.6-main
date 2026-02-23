import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnInit,
} from '@angular/core'
import {
  changelayout,
  changetheme,
  changemode,
  changetopbarcolor,
  changemenucolor,
  changesidebarsize,
  resetState,
} from '@core/states/layout/layout-action'
import {
  getLayoutColor,
  getLayoutMode,
  getTopbarcolor,
  getMenucolor,
  getSidebarsize,
} from '@core/states/layout/layout-selector'
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap'
import { Store } from '@ngrx/store'
import { SimplebarAngularModule } from 'simplebar-angular'

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [SimplebarAngularModule],
  templateUrl: './right-sidebar.component.html',
  styles: `
    :host {
      display: contents;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RightSidebarComponent implements OnInit {
  offcanvas = inject(NgbActiveOffcanvas)
  store = inject(Store)

  layout: string = ''
  color!: string
  topbar!: string
  menuColor!: string
  menuSize!: string
  mode!: string

  ngOnInit(): void {
    this.store.select('layout').subscribe((data: any) => {
      this.layout = data.LAYOUT
      this.color = data.LAYOUT_THEME
      this.topbar = data.TOPBAR_COLOR
      this.menuColor = data.MENU_COLOR
      this.menuSize = data.MENU_SIZE
      this.mode = data.LAYOUT_MODE
    })
  }

  // Change Layout
  changeLayout(layout: string) {
    this.layout = layout
    this.store.dispatch(changelayout({ layout }))
  }

  // Change Layout Color
  changeLayoutColor(color: any) {
    this.store.dispatch(changetheme({ color }))
    this.store.select(getLayoutColor).subscribe((color) => {
      document.documentElement.setAttribute('data-bs-theme', color)
    })
  }

  changeLayoutMode(mode: any) {
    this.store.dispatch(changemode({ mode }))
    this.store.select(getLayoutMode).subscribe((mode) => {
      document.documentElement.setAttribute('data-layout-mode', mode)
    })
  }

  // Change Topbar Color
  changeTopbar(topbar: any) {
    this.store.dispatch(changetopbarcolor({ topbar }))
    this.store.select(getTopbarcolor).subscribe((topbar) => {
      document.documentElement.setAttribute('data-topbar-color', topbar)
    })
  }

  // Change Menu Color
  changeMenu(menu: any) {
    this.store.dispatch(changemenucolor({ menu }))
    this.store.select(getMenucolor).subscribe((menucolor) => {
      document.documentElement.setAttribute('data-menu-color', menucolor)
    })
  }

  // Change Sidebar Size
  changeSize(size: any) {
    this.store.dispatch(changesidebarsize({ size }))
    this.store.select(getSidebarsize).subscribe((size) => {
      document.documentElement.setAttribute('data-sidenav-size', size)
    })
  }

  // Reset Option
  reset() {
    this.store.dispatch(resetState())
  }
}
