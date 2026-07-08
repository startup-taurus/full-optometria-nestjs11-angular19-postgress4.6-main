import {
  Component,
  ComponentRef,
  inject,
  Renderer2,
  OnInit,
  ViewContainerRef,
} from '@angular/core'
import { Router } from '@angular/router'
import { filter, take } from 'rxjs'
import { VerticalLayoutComponent } from '../vertical-layout/vertical-layout.component'
import { HorizontalLayoutComponent } from '../horizontal-layout/horizontal-layout.component'
import { Store } from '@ngrx/store'
import type { LayoutState } from '@core/states/layout/layout-reducers'
import { PermissionsService } from '@core/services/api/permissions.service'
import { TutorialService } from '@core/services/ui/tutorial.service'
import {
  WelcomeDialogComponent,
  type WelcomeDialogAction,
} from '../../../../features/tutorials/components/welcome-dialog/welcome-dialog.component'
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
  private router = inject(Router)
  private viewContainerRef = inject(ViewContainerRef)
  private tutorialService = inject(TutorialService)
  public permissionsService = inject(PermissionsService)

  private welcomeDialogRef?: ComponentRef<WelcomeDialogComponent>

  ngOnInit(): void {
    this.offerWelcomeTutorial()

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

  private offerWelcomeTutorial(): void {
    if (this.tutorialService.hasSeenWelcome()) {
      return
    }

    this.permissionsService.permissionsLoaded$
      .pipe(
        filter((loaded) => loaded),
        take(1)
      )
      .subscribe(() => this.showWelcomeDialog())
  }

  private showWelcomeDialog(): void {
    if (this.tutorialService.hasSeenWelcome() || this.welcomeDialogRef) {
      return
    }
    this.tutorialService.markWelcomeSeen()

    this.welcomeDialogRef = this.viewContainerRef.createComponent(
      WelcomeDialogComponent
    )
    this.welcomeDialogRef.instance.action.subscribe(
      (action: WelcomeDialogAction) => this.handleWelcomeAction(action)
    )
  }

  private handleWelcomeAction(action: WelcomeDialogAction): void {
    this.welcomeDialogRef?.destroy()
    this.welcomeDialogRef = undefined

    if (action === 'start') {
      this.tutorialService.start(this.tutorialService.getMainFlowTutorial().id)
    } else if (action === 'browse') {
      this.router.navigate(['/tutorials'])
    }
  }
}
