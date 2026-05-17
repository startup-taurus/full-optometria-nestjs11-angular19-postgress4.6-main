import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common'
import { Component, EventEmitter, Input, Output, signal } from '@angular/core'
import { DEFAULT_NGX_DATATABLE_CONFIG } from '@core/helpers/ui/ngx-datatable.constant'
import {
  NgxDatatableColumn,
  NgxDatatableConfig,
} from '@core/interfaces/ui/ngx-datatable.interface'
import { TranslatePipe } from '@ngx-translate/core'
import { NgxDatatableModule } from '@swimlane/ngx-datatable'

@Component({
  selector: 'app-mobile-card-list',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgTemplateOutlet,
    NgxDatatableModule,
    TranslatePipe,
  ],
  templateUrl: './mobile-card-list.component.html',
  styleUrl: './mobile-card-list.component.scss',
})
export class MobileCardListComponent {
  public ngxConfig: NgxDatatableConfig = { ...DEFAULT_NGX_DATATABLE_CONFIG }
  private expanded = signal<ReadonlySet<number>>(new Set<number>())

  @Input()
  public data: any[] | null = []

  @Input()
  set config(value: NgxDatatableConfig | Partial<NgxDatatableConfig> | null) {
    this.ngxConfig = { ...DEFAULT_NGX_DATATABLE_CONFIG, ...(value ?? {}) }
  }

  @Output()
  public onChangeLimit: EventEmitter<number> = new EventEmitter<number>()
  @Output()
  public onChangePage: EventEmitter<number> = new EventEmitter<number>()

  public get primaryColumns(): Partial<NgxDatatableColumn>[] {
    return (this.ngxConfig.columns || []).filter(
      (col) => col.isPrimary && !col.isActions
    )
  }

  public get bodyColumns(): Partial<NgxDatatableColumn>[] {
    return (this.ngxConfig.columns || []).filter(
      (col) => !col.isPrimary && !col.isActions && !col.hideOnMobile
    )
  }

  public get actionsColumn(): Partial<NgxDatatableColumn> | null {
    return (this.ngxConfig.columns || []).find((col) => col.isActions) ?? null
  }

  public isExpanded(rowIndex: number): boolean {
    return this.expanded().has(rowIndex)
  }

  public toggleExpand(rowIndex: number): void {
    const next = new Set(this.expanded())
    if (next.has(rowIndex)) next.delete(rowIndex)
    else next.add(rowIndex)
    this.expanded.set(next)
  }

  public emitChangeLimit(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value)
    if (Number.isNaN(value)) return
    this.ngxConfig.limit = value
    this.expanded.set(new Set())
    this.onChangeLimit.emit(value)
  }

  public emitChangePage(event: { page: number }): void {
    if (!event.page) return
    this.ngxConfig.page = event.page
    this.expanded.set(new Set())
    this.onChangePage.emit(event.page)
  }

  public trackByIndex = (index: number): number => index
}
