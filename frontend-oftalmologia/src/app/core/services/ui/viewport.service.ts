import { BreakpointObserver } from '@angular/cdk/layout'
import { inject, Injectable } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs/operators'

const MOBILE_QUERY = '(max-width: 767.98px)'

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private breakpointObserver = inject(BreakpointObserver)

  public isMobile = toSignal(
    this.breakpointObserver
      .observe(MOBILE_QUERY)
      .pipe(map((state) => state.matches)),
    {
      initialValue:
        typeof window !== 'undefined' &&
        window.matchMedia(MOBILE_QUERY).matches,
    }
  )
}
