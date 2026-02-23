import {
  Component,
  inject,
  type OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core'
import { SimplebarAngularModule } from 'simplebar-angular'
import { LogoComponent } from '../logo/logo.component'
import { MENU_ITEMS, type MenuItemType } from '@core/helpers/ui/menu-meta'
import { basePath } from '@core/helpers/ui/constants'
import { NavigationEnd, Router, RouterModule } from '@angular/router'
import { Store } from '@ngrx/store'
import { findAllParent, findMenuItem } from '@core/helpers/ui/utils'
import { NgbCollapseModule, type NgbCollapse } from '@ng-bootstrap/ng-bootstrap'
import { CommonModule } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { changesidebarsize } from '@core/states/layout/layout-action'
import { getSidebarsize } from '@core/states/layout/layout-selector'
import { PermissionsService } from '@core/services/api/permissions.service'
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    SimplebarAngularModule,
    LogoComponent,
    CommonModule,
    NgbCollapseModule,
    RouterModule,
    TranslateModule,
  ],
  templateUrl: './sidebar.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styles: ``,
})
export class SidebarComponent implements OnInit {
  menuItems: MenuItemType[] = []
  filteredMenuItems: MenuItemType[] = []
  activeMenuItems: string[] = []

  router = inject(Router)
  trimmedURL = this.router.url?.replaceAll(
    basePath !== '' ? basePath + '/' : '',
    '/'
  )

  store = inject(Store)
  public permissionsService = inject(PermissionsService)

  constructor() {
    this.router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        this.trimmedURL = this.router.url?.replaceAll(
          basePath !== '' ? basePath + '/' : '',
          '/'
        )
        this._activateMenu()
        setTimeout(() => {
          this.scrollToActive()
        }, 200)
      }
    })
  }

  ngOnInit(): void {
    this.initMenu()

    this.permissionsService.permissionsLoaded$.subscribe((loaded) => {
      if (loaded) {
        setTimeout(() => {
          this.filterMenuItems()
        }, 100)
      }
    })

    this.permissionsService.userPermissions$.subscribe((permissions) => {
      if (permissions) {
        setTimeout(() => {
          this.filterMenuItems()
        }, 50)
      }
    })

    this.filterMenuItems()
  }

  initMenu(): void {
    this.menuItems = MENU_ITEMS
    this.filteredMenuItems = this.menuItems
  }

  private filterMenuItems(): void {
    const permissionsLoaded = this.permissionsService.isLoaded()

    if (!permissionsLoaded) {
      this.filteredMenuItems = []
      return
    }

    this.filteredMenuItems = this.menuItems.filter((item) => {
      if (item.isTitle) {
        return true
      }


      if (item.key === 'COMPANIES') {
        return this.permissionsService.isSuperAdmin()
      }

      if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
        return true
      }

      const hasPermission = item.requiredPermissions.some((permissionId) =>
        this.permissionsService.hasPermissionById(permissionId)
      )

      return hasPermission
    })
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this._activateMenu()
    })
    setTimeout(() => {
      this.scrollToActive()
    }, 200)
  }

  hasSubmenu(menu: MenuItemType): boolean {
    return menu.children ? true : false
  }

  scrollToActive(): void {
    const activatedItem = document.querySelector('.side-nav-item li a.active')
    if (activatedItem) {
      const simplebarContent = document.querySelector(
        '.sidenav-menu .simplebar-content-wrapper'
      )
      if (simplebarContent) {
        const activatedItemRect = activatedItem.getBoundingClientRect()
        const simplebarContentRect = simplebarContent.getBoundingClientRect()
        const activatedItemOffsetTop =
          activatedItemRect.top + simplebarContent.scrollTop
        const centerOffset =
          activatedItemOffsetTop -
          simplebarContentRect.top -
          simplebarContent.clientHeight / 2 +
          activatedItemRect.height / 2
        this.scrollTo(simplebarContent, centerOffset, 600)
      }
    }
  }

  easeInOutQuad(t: number, b: number, c: number, d: number): number {
    t /= d / 2
    if (t < 1) return (c / 2) * t * t + b
    t--
    return (-c / 2) * (t * (t - 2) - 1) + b
  }

  scrollTo(element: Element, to: number, duration: number): void {
    const start = element.scrollTop
    const change = to - start
    const increment = 20
    let currentTime = 0

    const animateScroll = () => {
      currentTime += increment
      const val = this.easeInOutQuad(currentTime, start, change, duration)
      element.scrollTop = val
      if (currentTime < duration) {
        setTimeout(animateScroll, increment)
      }
    }
    animateScroll()
  }

  _activateMenu(): void {
    const div = document.querySelector('.sidenav-menu')

    let matchingMenuItem = null

    if (div) {
      let items: any = div.getElementsByClassName('nav-link-ref')
      for (let i = 0; i < items.length; ++i) {
        if (
          this.trimmedURL === items[i].pathname ||
          (this.trimmedURL.startsWith('/invoice/') &&
            items[i].pathname === '/invoice/RB6985') ||
          (this.trimmedURL.startsWith('/ecommerce/product/') &&
            items[i].pathname === '/ecommerce/product/1')
        ) {
          matchingMenuItem = items[i]
          break
        }
      }

      if (matchingMenuItem) {
        const mid = matchingMenuItem.getAttribute('aria-controls')
        const activeMt = findMenuItem(this.menuItems, mid)

        if (activeMt) {
          const matchingObjs = [
            activeMt['key'],
            ...findAllParent(this.menuItems, activeMt),
          ]

          this.activeMenuItems = matchingObjs
          this.menuItems.forEach((menu: MenuItemType) => {
            menu.collapsed = !matchingObjs.includes(menu.key!)
          })
        }
      }
    }
  }

  /**
   * toggles open menu
   * @param menuItem clicked menuitem
   * @param collapse collpase instance
   */
  toggleMenuItem(menuItem: MenuItemType, collapse: NgbCollapse): void {
    collapse.toggle()
    let openMenuItems: string[]
    if (!menuItem.collapsed) {
      openMenuItems = [
        menuItem['key'],
        ...findAllParent(this.menuItems, menuItem),
      ]
      this.menuItems.forEach((menu: MenuItemType) => {
        if (!openMenuItems.includes(menu.key!)) {
          menu.collapsed = true
        }
      })
    }
  }

  changeSidebarSize() {
    let size = document.documentElement.getAttribute('data-sidenav-size')
    if (size == 'sm-hover') {
      size = 'sm-hover-active'
    } else {
      size = 'sm-hover'
    }
    this.store.dispatch(changesidebarsize({ size }))
    this.store.select(getSidebarsize).subscribe((size) => {
      document.documentElement.setAttribute('data-sidenav-size', size)
    })
  }
}
