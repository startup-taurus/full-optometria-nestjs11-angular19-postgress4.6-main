import { Injectable, Inject, NgZone } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { DOCUMENT } from '@angular/common'
import { AuthenticationService } from '@core/services/api/auth.service'
import { Subject, fromEvent, merge, timer, interval } from 'rxjs'
import { switchMap, tap, takeUntil, filter } from 'rxjs/operators'
import { ToastrNotificationService } from './notification.service'
import { TIMEOUTS } from '@core/helpers/ui/constants'
import { Store } from '@ngrx/store'
import { selectUser } from '@core/states/auth/auth.selectors'

@Injectable({
  providedIn: 'root',
})
export class SessionTimeoutService {
  private timeoutDuration = TIMEOUTS.TIMEOUT_DURATION
  private warningDuration = TIMEOUTS.WARINING_DURATION
  private reset$ = new Subject<void>()
  private destroy$ = new Subject<void>()
  private countdownValue = 10
  private countdown$ = new Subject<number>()
  private excludedRoutes = ['/auth/login', '/auth/lock-screen']

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private ngZone: NgZone,
    private _notificationService: ToastrNotificationService,
    private store: Store,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        tap((event: any) => {
          if (this.excludedRoutes.includes(event.url)) {
            this.stopTracking()
          } else {
            this.startTracking()
          }
        })
      )
      .subscribe()
  }

  private startTracking() {
    this.ngZone.runOutsideAngular(() => {
      const events = ['mousemove', 'keydown', 'scroll', 'click']
      const eventStreams = events.map((event) =>
        fromEvent(this.document, event)
      )

      merge(...eventStreams)
        .pipe(tap(() => this.resetTimeout()))
        .subscribe()

      this.startTimeout()
    })
  }

  private startTimeout() {
    if (this.isExcludedRoute()) return
    timer(this.timeoutDuration - this.warningDuration)
      .pipe(
        tap(() => this.startWarningCountdown()),
        switchMap(() => timer(this.warningDuration)),
        tap(() => this.lockSession()),
        takeUntil(this.reset$),
        takeUntil(this.destroy$)
      )
      .subscribe()
  }

  private startWarningCountdown() {
    if (this.authService.isLocked() || this.isExcludedRoute()) return
    this.countdownValue = this.warningDuration / 1000

    interval(1000)
      .pipe(
        tap(() => {
          this.countdown$.next(this.countdownValue)
          this.showWarningToast(this.countdownValue)
          this.countdownValue--
        }),
        takeUntil(timer(this.warningDuration)),
        takeUntil(this.reset$),
        takeUntil(this.destroy$)
      )
      .subscribe()
  }

  private showWarningToast(timeLeft: number) {
    this._notificationService.showNotification({
      type: 'warning',
      title: 'Aviso de Inactividad',
      message: `⚠️ Tu sesión se bloqueará en ${timeLeft} segundos.`,
    })
  }

  private resetTimeout() {
    if (this.isExcludedRoute()) return
    this.reset$.next()
    this.startTimeout()
  }

  private lockSession() {
    if (this.isExcludedRoute()) return
    
    this.store.select(selectUser).pipe(
      tap(user => {
        this.authService.lockSession(user || undefined)
        this.router.navigate(['/auth/lock-screen'])
      }),
      takeUntil(this.destroy$)
    ).subscribe()
  }

  stopTracking() {
    this.destroy$.next()
  }

  getCountdownObservable() {
    return this.countdown$.asObservable()
  }

  private isExcludedRoute(): boolean {
    return this.excludedRoutes.includes(this.router.url)
  }
}
