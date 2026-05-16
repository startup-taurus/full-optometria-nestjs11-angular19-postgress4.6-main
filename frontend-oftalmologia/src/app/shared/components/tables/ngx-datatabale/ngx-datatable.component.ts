import { NgTemplateOutlet } from '@angular/common'
import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  inject,
} from '@angular/core'
import { DEFAULT_NGX_DATATABLE_CONFIG } from '@core/helpers/ui/ngx-datatable.constant'
import {
  NgxDatatableColumn,
  NgxDatatableConfig,
} from '@core/interfaces/ui/ngx-datatable.interface'
import { ViewportService } from '@core/services/ui/viewport.service'
import { TranslatePipe } from '@ngx-translate/core'
import { DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable'
import { MobileCardListComponent } from '../mobile-card-list/mobile-card-list.component'

const ACTIONS_CELL_CLASS = 'datatable-actions-cell'
const DEFAULT_ACTIONS_WIDTH = 160

@Component({
  selector: 'shared-ngx-datatable',
  standalone: true,
  imports: [
    NgxDatatableModule,
    TranslatePipe,
    NgTemplateOutlet,
    MobileCardListComponent,
  ],
  templateUrl: './ngx-datatable.component.html',
})
export class NgxDatatableComponent
  implements AfterViewInit, AfterViewChecked, OnDestroy
{
  public ngxConfig: NgxDatatableConfig = { ...DEFAULT_NGX_DATATABLE_CONFIG }
  private hasEmittedFirstHigherLimit: boolean = false
  private transformedColumnCache = new WeakMap<
    Partial<NgxDatatableColumn>,
    Partial<NgxDatatableColumn>
  >()
  private lastColumnsRef: Partial<NgxDatatableColumn>[] | null = null
  private lastTransformedColumns: Partial<NgxDatatableColumn>[] = []
  private themeObserver?: MutationObserver
  private pendingThemeFix = 0
  private cachedBodyBg = ''
  private cachedHeaderBg = ''
  // Flag de optimización: cuando todas las cells visibles están procesadas,
  // ngAfterViewChecked sale en O(1) sin tocar el DOM. Se resetea solo cuando
  // llega nueva data/config o cambia el tema (puntos donde pueden aparecer
  // cells nuevas).
  private allCellsFixed = false

  protected isMobile = inject(ViewportService).isMobile
  private elementRef = inject(ElementRef<HTMLElement>)

  private _data: any[] | null = []

  @Input({ required: true })
  set data(value: any[] | null) {
    this._data = value
    // Nueva data → pueden aparecer cells nuevas → reabrir el chequeo.
    this.allCellsFixed = false
  }
  get data(): any[] | null {
    return this._data
  }

  @Input({ required: true })
  set config(value: Partial<NgxDatatableConfig> | null) {
    const merged: NgxDatatableConfig = {
      ...DEFAULT_NGX_DATATABLE_CONFIG,
      ...value,
    }
    merged.columns = this.transformColumns(merged.columns || [])
    this.ngxConfig = merged
    this.allCellsFixed = false
  }

  @Output()
  public onSelectRow: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  public onChangeLimit: EventEmitter<number> = new EventEmitter<number>()
  @Output()
  public onChangePage: EventEmitter<number> = new EventEmitter<number>()

  constructor() {}

  public ngAfterViewInit(): void {
    this.startThemeObserver()
    this.applyStickyActionsFix(this.elementRef.nativeElement)
  }

  /**
   * Aplica el fix solo cuando puede haber trabajo pendiente. El flag
   * `allCellsFixed` se setea a `false` solo cuando cambia data/config/tema
   * y se confirma `true` después de procesar todas las cells. Mientras la
   * tabla está estable (scroll horizontal, hover, paginación interna), el
   * ngAfterViewChecked sale en O(1) → no consume recursos.
   */
  public ngAfterViewChecked(): void {
    if (this.allCellsFixed) return
    const host = this.elementRef.nativeElement as HTMLElement
    const needsFix = host.querySelector(
      `.${ACTIONS_CELL_CLASS}:not([data-sticky-fix="1"])`
    )
    if (!needsFix) {
      this.allCellsFixed = true
      return
    }
    this.applyStickyActionsFix(host)
    const stillNeeds = host.querySelector(
      `.${ACTIONS_CELL_CLASS}:not([data-sticky-fix="1"])`
    )
    if (!stillNeeds) this.allCellsFixed = true
  }

  public ngOnDestroy(): void {
    this.themeObserver?.disconnect()
    if (this.pendingThemeFix) cancelAnimationFrame(this.pendingThemeFix)
  }

  private startThemeObserver(): void {
    if (typeof MutationObserver === 'undefined') return
    this.themeObserver = new MutationObserver(() => this.scheduleThemeRefresh())
    // Observar html (donde Bootstrap aplica [data-bs-theme]) y body por si
    // algún sistema externo aplica el tema ahí.
    this.themeObserver.observe(document.documentElement, { attributes: true })
    this.themeObserver.observe(document.body, { attributes: true })
  }

  /**
   * Cuando cambia el tema, los nuevos colores tardan un frame en propagarse
   * al computed style. Esperamos 2 rAFs antes de leer y re-aplicar.
   */
  private scheduleThemeRefresh(): void {
    if (this.pendingThemeFix) cancelAnimationFrame(this.pendingThemeFix)
    this.pendingThemeFix = requestAnimationFrame(() => {
      this.pendingThemeFix = requestAnimationFrame(() => {
        this.pendingThemeFix = 0
        this.cachedBodyBg = ''
        this.cachedHeaderBg = ''
        this.clearStickyFixMarkers()
        this.allCellsFixed = false
        this.applyStickyActionsFix(this.elementRef.nativeElement)
      })
    })
  }

  private clearStickyFixMarkers(): void {
    const host = this.elementRef.nativeElement as HTMLElement
    host
      .querySelectorAll<HTMLElement>('[data-sticky-fix]')
      .forEach((el) => {
        delete el.dataset['stickyFix']
        delete el.dataset['stickyFixBg']
      })
  }

  private refreshCachedBgs(host: HTMLElement): void {
    if (!this.cachedBodyBg) {
      this.cachedBodyBg = this.resolveThemeBg(false)
    }
    if (!this.cachedHeaderBg) {
      this.cachedHeaderBg = this.resolveThemeBg(true)
    }
  }

  /**
   * Resuelve el background-color del tema actual leyendo --bs-body-bg
   * / --bs-tertiary-bg del :root. Estas variables las redefine Bootstrap
   * con [data-bs-theme="dark"], así que cambian automáticamente con el
   * tema. Si la variable no está definida (no debería pasar con BS5+),
   * cae a un ancestor opaco y finalmente a hardcoded.
   */
  private resolveThemeBg(forHeader: boolean): string {
    const rootStyle = window.getComputedStyle(document.documentElement)
    const primary = rootStyle
      .getPropertyValue(forHeader ? '--bs-tertiary-bg' : '--bs-body-bg')
      .trim()
    if (primary && this.isOpaqueColor(primary)) return primary

    // Fallback: leer body
    const bodyStyle = window.getComputedStyle(document.body)
    const bodyPrimary = bodyStyle
      .getPropertyValue(forHeader ? '--bs-tertiary-bg' : '--bs-body-bg')
      .trim()
    if (bodyPrimary && this.isOpaqueColor(bodyPrimary)) return bodyPrimary

    // Fallback final: el bg computado del body
    const docBg = bodyStyle.backgroundColor
    if (this.isOpaqueColor(docBg)) return docBg

    const isDark =
      document.documentElement.getAttribute('data-bs-theme') === 'dark'
    if (forHeader) return isDark ? '#1f2231' : '#f3f5f9'
    return isDark ? '#1a1d29' : '#ffffff'
  }

  private isOpaqueColor(color: string): boolean {
    if (!color || color === 'transparent') return false
    const match = color.match(/rgba?\(([^)]+)\)/i)
    if (!match) return color.startsWith('#') || /^[a-z]+$/i.test(color)
    const parts = match[1].split(',').map((s) => s.trim())
    if (parts.length < 4) return true
    return parseFloat(parts[3]) >= 0.99
  }

  private applyStickyActionsFix(host: HTMLElement): void {
    const cells = host.querySelectorAll<HTMLElement>(`.${ACTIONS_CELL_CLASS}`)
    if (cells.length === 0) return

    this.refreshCachedBgs(host)
    const bodyBg = this.cachedBodyBg
    const headerBg = this.cachedHeaderBg

    cells.forEach((cell) => {
      if (cell.dataset['stickyFix'] === '1') return

      const isHeader = cell.classList.contains('datatable-header-cell')
      const bg = isHeader ? headerBg : bodyBg
      if (!bg) return

      cell.dataset['stickyFixBg'] = bg
      cell.dataset['stickyFix'] = '1'

      cell.style.setProperty('background-color', bg, 'important')
      cell.style.setProperty('background-image', 'none', 'important')
      cell.style.setProperty('z-index', '99', 'important')

      const innerWrap =
        cell.querySelector<HTMLElement>(
          '.datatable-body-cell-label, .datatable-header-cell-template-wrap'
        ) ?? null
      if (innerWrap) {
        innerWrap.style.setProperty('background-color', bg, 'important')
        innerWrap.style.setProperty('background-image', 'none', 'important')
      }

      const rowRight = cell.closest<HTMLElement>(
        '.datatable-row-right, .datatable-row-group'
      )
      if (rowRight && rowRight.dataset['stickyFix'] !== '1') {
        rowRight.dataset['stickyFix'] = '1'
        rowRight.dataset['stickyFixBg'] = bg
        rowRight.style.setProperty('background-color', bg, 'important')
        rowRight.style.setProperty('background-image', 'none', 'important')
      }
    })
  }

  public emitOnSelectRow(selectedRow: any): void {
    if (!selectedRow) return
    this.onSelectRow.emit(selectedRow)
  }

  public emitOnChangeLimit(event: Event): void {
    const limit = (event.target as HTMLSelectElement).value
    const formattedLimit = parseInt(limit)
    this.ngxConfig.limit = formattedLimit
    const shouldEmitLimit = this.shouldEmitLimit(
      this.ngxConfig.count,
      this.ngxConfig.limit
    )
    if (shouldEmitLimit) {
      this.onChangeLimit.emit(this.ngxConfig.limit)
    }
  }

  public emitMobileChangeLimit(limit: number): void {
    this.ngxConfig.limit = limit
    const shouldEmitLimit = this.shouldEmitLimit(
      this.ngxConfig.count,
      this.ngxConfig.limit
    )
    if (shouldEmitLimit) {
      this.onChangeLimit.emit(this.ngxConfig.limit)
    }
  }

  public emitOnChangePage($event: { page: number }): void {
    if (!$event.page) return
    this.ngxConfig.page = $event.page
    this.onChangePage.emit(this.ngxConfig.page)
  }

  public emitMobileChangePage(page: number): void {
    if (!page) return
    this.ngxConfig.page = page
    this.onChangePage.emit(page)
  }

  public toggleExpandRow(ngxDatatable: DatatableComponent, row: any) {
    ngxDatatable.rowDetail.toggleExpandRow(row)
  }

  private transformColumns(
    columns: Partial<NgxDatatableColumn>[]
  ): Partial<NgxDatatableColumn>[] {
    if (columns === this.lastColumnsRef) return this.lastTransformedColumns
    const next = columns.map((col) => this.applyActionsDefaults(col))
    this.lastColumnsRef = columns
    this.lastTransformedColumns = next
    return next
  }

  private applyActionsDefaults(
    col: Partial<NgxDatatableColumn>
  ): Partial<NgxDatatableColumn> {
    if (!col.isActions) return col
    const cached = this.transformedColumnCache.get(col)
    if (cached) return cached
    const transformed: Partial<NgxDatatableColumn> = {
      ...col,
      frozenRight: true,
      width: col.width ?? DEFAULT_ACTIONS_WIDTH,
      cellClass: this.mergeClass(col.cellClass, ACTIONS_CELL_CLASS),
      headerClass: this.mergeClass(col.headerClass, ACTIONS_CELL_CLASS),
    }
    this.transformedColumnCache.set(col, transformed)
    return transformed
  }

  private mergeClass(
    existing: NgxDatatableColumn['cellClass'] | undefined,
    extra: string
  ): string {
    if (!existing) return extra
    if (typeof existing === 'string') {
      return existing.includes(extra) ? existing : `${existing} ${extra}`
    }
    return extra
  }

  private shouldEmitLimit(count: number, limit: number): boolean {
    const cond1 = this.shouldEmitOnLimitExceeded(count, limit)
    const cond2 = this.shouldEmitOnFirstLowerCount(count, limit)
    return cond1 || cond2
  }

  private shouldEmitOnLimitExceeded(count: number, limit: number): boolean {
    if (limit < count) {
      this.hasEmittedFirstHigherLimit = false
      return true
    }
    return false
  }

  private shouldEmitOnFirstLowerCount(count: number, limit: number): boolean {
    if (count < limit && !this.hasEmittedFirstHigherLimit) {
      this.hasEmittedFirstHigherLimit = true
      return true
    }
    return false
  }
}
