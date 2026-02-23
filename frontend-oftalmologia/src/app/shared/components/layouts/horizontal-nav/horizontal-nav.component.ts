import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { NavigationEnd, RouterModule,  Router } from '@angular/router';
import { HORIZONTAL_MENU_ITEM, type MenuItemType } from '@core/helpers/ui/menu-meta';
import { findAllParent, findMenuItem } from '@core/helpers/ui/utils';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'horizontal-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule],
  templateUrl: './horizontal-nav.component.html',
  styles: ``
})
export class HorizontalNavComponent implements OnInit{
  menuItems: MenuItemType[] = []
  activeMenuItems: string[] = []

  constructor(router: Router) {
    router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        this._activateMenu()
      }
    })
  }

  ngOnInit(): void {
    this.menuItems = HORIZONTAL_MENU_ITEM
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this._activateMenu()
    })
  }

  /**
   * activate the menuitems
   */
  _activateMenu(): void {
    const div = document.getElementById('topnav-menu-content')
    let matchingMenuItem = null
    if (div) {
      let items: HTMLCollectionOf<HTMLAnchorElement> =
        div.getElementsByClassName(
          'nav-link-ref'
        ) as HTMLCollectionOf<HTMLAnchorElement>
      for (let i = 0; i < items.length; ++i) {
        if (window.location.pathname === items[i].pathname) {
          matchingMenuItem = items[i]
          break
        }
      }

      if (matchingMenuItem) {
        const mid = matchingMenuItem.getAttribute('data-menu-key')
        const activeMt = findMenuItem(this.menuItems, mid!)
        if (activeMt) {
          this.activeMenuItems = [
            activeMt['key']!,
            ...findAllParent(this.menuItems, activeMt),
          ]
        }
      }
    }
  }

  hasSubmenu(menu: MenuItemType): boolean {
    return menu.children ? true : false
  }
}
