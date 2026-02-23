// title.service.ts
import { Injectable } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { filter } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  constructor(
    private titleService: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService
  ) {}

  init(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateTitle()
      })
  }

  private updateTitle(): void {
    let route = this.activatedRoute
    while (route.firstChild) {
      route = route.firstChild
    }

    if (route.snapshot.data['title']) {
      const title = route.snapshot.data['title']
      const translatedTitle = this.translateService.instant(title)
      this.titleService.setTitle(
        translatedTitle !== title ? translatedTitle : title
      )
    }
  }
}
