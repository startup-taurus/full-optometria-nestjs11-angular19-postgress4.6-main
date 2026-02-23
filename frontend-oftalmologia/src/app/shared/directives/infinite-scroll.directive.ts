import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core'
import { fromEvent, Subject, debounceTime, takeUntil } from 'rxjs'

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
    fromEvent(this.el.nativeElement, 'scroll')
      .pipe(debounceTime(this.scrollDebounce), takeUntil(this.destroy$))
      .subscribe(() => {
        this.onScroll()
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private onScroll(): void {
    if (this.isLoading || !this.hasMore) {
      return
    }

    const element = this.el.nativeElement
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight
    const clientHeight = element.clientHeight

    const scrollPosition = scrollTop + clientHeight
    const scrollEnd = scrollHeight - this.scrollThreshold

    if (scrollPosition >= scrollEnd) {
      this.scrolled.emit()
    }
  }
}
