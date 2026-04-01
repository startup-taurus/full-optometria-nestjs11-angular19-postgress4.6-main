import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core'
import { fromEvent, merge, Subject, debounceTime, takeUntil } from 'rxjs'

@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true,
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  @Input() scrollThreshold = 200
  @Input() scrollDebounce = 100
  @Input() isLoading = false
  @Input() hasMore = true

  @Output() scrolled = new EventEmitter<void>()

  private destroy$ = new Subject<void>()

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    merge(fromEvent(this.el.nativeElement, 'scroll'), fromEvent(window, 'scroll'), fromEvent(window, 'resize'))
      .pipe(debounceTime(this.scrollDebounce), takeUntil(this.destroy$))
      .subscribe(() => {
        this.onScroll()
      })

    this.onScroll()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private onScroll(): void {
    if (this.isLoading || !this.hasMore) {
      return
    }

    if (this.hasReachedScrollEnd()) {
      this.scrolled.emit()
    }
  }

  private hasReachedScrollEnd(): boolean {
    const element = this.el.nativeElement as HTMLElement

    if (this.isElementScrollable(element)) {
      const scrollPosition = element.scrollTop + element.clientHeight
      const scrollEnd = element.scrollHeight - this.scrollThreshold
      return scrollPosition >= scrollEnd
    }

    const rect = element.getBoundingClientRect()
    const viewportBottom = window.innerHeight
    const distanceToBottom = rect.bottom - viewportBottom

    return distanceToBottom <= this.scrollThreshold
  }

  private isElementScrollable(element: HTMLElement): boolean {
    return element.scrollHeight > element.clientHeight + 1
  }
}
