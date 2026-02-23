import { TemplateRef } from '@angular/core'
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable'

export interface NgxDatatableColumn {
  name: string
  prop: string
  sortable: boolean
  width: number
  hide: boolean
  frozenLeft: boolean
  frozenRight: boolean
  cellTemplate: TemplateRef<any>
  isExpandable: boolean
  expandableCellTemplate: TemplateRef<any>
  expandableRowTemplate: TemplateRef<any>
  summaryTemplate: TemplateRef<any>
  summaryFunc: (cells: any[]) => any
}

export interface NgxDatatableLimit {
  label: string
  value: number
}

export interface NgxDatatableConfig {
  columns: Partial<NgxDatatableColumn>[]
  loadingIndicator: boolean
  columnMode: ColumnMode
  selectionType: SelectionType
  scrollbarH: boolean
  rowHeight: number | 'auto'
  count: number
  limit: number
  page: number
  limitOptions: NgxDatatableLimit[]
  summaryPosition: 'bottom' | 'top'
  summaryRow: boolean
  emptyMessage: string
}
