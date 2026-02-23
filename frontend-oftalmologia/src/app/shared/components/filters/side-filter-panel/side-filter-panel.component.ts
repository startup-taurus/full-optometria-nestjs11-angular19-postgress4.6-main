import { CommonModule } from '@angular/common'
import {
  Component,
  ComponentRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  Type,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'
import { FilterCommunicationService } from '@core/services/ui/filter-comumunication.service'

export interface FilterValue {
  [key: string]: any
}

export interface FilterPanelConfig {
  title?: string
  showBadge?: boolean
  badgeCount?: number
  position?: 'right' | 'left'
  width?: string
  backdrop?: boolean
  closeOnEsc?: boolean
}

@Component({
  selector: 'side-filter-panel',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './side-filter-panel.component.html',
  styleUrls: ['./side-filter-panel.component.scss'],
})
export class SideFilterPanelComponent implements OnInit, OnDestroy {
  @Input() config: FilterPanelConfig = {
    title: 'WORDS.FILTER',
    showBadge: true,
    badgeCount: 0,
    position: 'right',
    width: '400px',
    backdrop: true,
    closeOnEsc: true,
  }

  @Input() filterComponent: Type<any> | null = null
  @Input() filterTemplate: TemplateRef<any> | null = null
  @Input() isOpen = false

  @Output() filterApplied = new EventEmitter<FilterValue>()
  @Output() filterCleared = new EventEmitter<void>()
  @Output() panelToggled = new EventEmitter<boolean>()
  @Output() filterCountChanged = new EventEmitter<number>()
  @Output() resetRequested = new EventEmitter<void>()

  @ViewChild('filterContainer', { read: ViewContainerRef })
  filterContainer!: ViewContainerRef

  private componentRef: ComponentRef<any> | null = null
  private destroy$ = new Subject<void>()
  private focusedElementBeforeOpen: HTMLElement | null = null
  private _filterCommunicationService = inject(FilterCommunicationService)

  ngOnInit(): void {
    this.mergeDefaultConfig()
    this.subscribeToFilterCommunication()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
    this.cleanupComponent()
  }

  private subscribeToFilterCommunication(): void {
    this._filterCommunicationService.currentFilter
      .pipe(takeUntil(this.destroy$))
      .subscribe((filter) => {
        if (filter && Object.keys(filter).length === 0) {
          this.updateBadgeCount(0)
        } else if (filter && Object.keys(filter).length > 0) {
          const count = this.countActiveFilters(filter)
          this.updateBadgeCount(count)
        } else {
          this.updateBadgeCount(0)
        }
      })
  }

  private mergeDefaultConfig(): void {
    this.config = {
      title: 'WORDS.FILTER',
      showBadge: true,
      badgeCount: 0,
      position: 'right',
      width: '400px',
      backdrop: true,
      closeOnEsc: true,
      ...this.config,
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.config.closeOnEsc && this.isOpen) {
      event.preventDefault()
      this.closePanel()
    }
  }

  public togglePanel(): void {
    if (this.isOpen) {
      this.closePanel()
    } else {
      this.openPanel()
    }
  }

  public openPanel(): void {
    this.focusedElementBeforeOpen = document.activeElement as HTMLElement
    this.isOpen = true
    this.panelToggled.emit(true)
    this.loadFilterComponent()

    setTimeout(() => {
      const closeButton = document.querySelector(
        '.side-filter-panel .btn-close'
      ) as HTMLElement
      if (closeButton) {
        closeButton.focus()
      }
    }, 100)
  }

  public closePanel(): void {
    this.isOpen = false
    this.panelToggled.emit(false)
    this.cleanupComponent()

    if (this.focusedElementBeforeOpen) {
      this.focusedElementBeforeOpen.focus()
    }
  }

  public onBackdropClick(): void {
    if (this.config.backdrop && this.isOpen) {
      this.closePanel()
    }
  }

  public onPanelClick(event: Event): void {
    event.stopPropagation()
  }

  private loadFilterComponent(): void {
    if (!this.filterContainer) {
      setTimeout(() => this.loadFilterComponent(), 50)
      return
    }

    this.cleanupComponent()

    if (this.filterComponent) {
      this.componentRef = this.filterContainer.createComponent(
        this.filterComponent
      )

      if (this.componentRef.instance.filterApplied) {
        this.componentRef.instance.filterApplied
          .pipe(takeUntil(this.destroy$))
          .subscribe((filters: FilterValue) => {
            this.onFiltersApplied(filters)
          })
      }

      if (this.componentRef.instance.filterCleared) {
        this.componentRef.instance.filterCleared
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.onFiltersCleared()
          })
      }

      if (this.componentRef.instance.filterCountChanged) {
        this.componentRef.instance.filterCountChanged
          .pipe(takeUntil(this.destroy$))
          .subscribe((count: number) => {
            this.updateBadgeCount(count)
          })
      }
    }
  }

  private cleanupComponent(): void {
    if (this.componentRef) {
      this.componentRef.destroy()
      this.componentRef = null
    }
    this.filterContainer?.clear()
  }

  private onFiltersApplied(filters: FilterValue): void {
    this.filterApplied.emit(filters)
    this.updateBadgeCount(this.countActiveFilters(filters))
    this.closePanel()
  }

  private onFiltersCleared(): void {
    this.filterCleared.emit()
    this.filterApplied.emit({}) 
    this.updateBadgeCount(0)
  }

  public resetFilters(): void {
    this._filterCommunicationService.resetFilter()
    this.updateBadgeCount(0)
    this.resetRequested.emit()
    
    this.filterCleared.emit()
    this.filterApplied.emit({})
  }

  public hasActiveFilters(): boolean {
    return (this.config.badgeCount || 0) > 0
  }

  private updateBadgeCount(count: number): void {
    this.config.badgeCount = count
    this.filterCountChanged.emit(count)
  }

  private countActiveFilters(filters: FilterValue): number {
    if (!filters) return 0

    return Object.values(filters).filter((value) => {
      if (typeof value === 'boolean') return true
      if (typeof value === 'number') return value !== 0
      if (typeof value === 'string') return value.trim() !== ''
      if (Array.isArray(value)) return value.length > 0
      return value != null && value !== undefined
    }).length
  }

  public get panelClasses(): string {
    const baseClass = 'side-filter-panel'
    const positionClass = `${baseClass}--${this.config.position}`
    const openClass = this.isOpen ? `${baseClass}--open` : ''

    return `${baseClass} ${positionClass} ${openClass}`.trim()
  }

  public get panelStyles(): any {
    return {
      width: this.config.width,
      [this.config.position as string]: this.isOpen
        ? '0'
        : `-${this.config.width}`,
    }
  }
}
