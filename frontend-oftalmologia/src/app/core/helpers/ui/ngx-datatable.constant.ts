import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable'
import {
  NgxDatatableConfig,
  NgxDatatableLimit,
} from 'src/app/core/interfaces/ui/ngx-datatable.interface'

export const DEFAULT_NGX_DATATABLE_LIMITS: NgxDatatableLimit[] = [
  {
    label: '10 Items',
    value: 10,
  },
  {
    label: '50 Items',
    value: 50,
  },
  {
    label: '100 Items',
    value: 100,
  },
  {
    label: '1000 Items',
    value: 1000,
  },
]

export const DEFAULT_NGX_DATATABLE_PAGINATION = {
  LIMIT: 10,
  PAGE: 1,
}

export const DEFAULT_NGX_DATATABLE_CONFIG: NgxDatatableConfig = {
  columns: [],
  loadingIndicator: false,
  columnMode: ColumnMode.force,
  selectionType: SelectionType.single,
  scrollbarH: true,
  rowHeight: 'auto',
  summaryPosition: 'bottom',
  summaryRow: false,
  count: 0,
  limit: 10,
  page: 1,
  limitOptions: DEFAULT_NGX_DATATABLE_LIMITS,
  emptyMessage: 'WORDS.NGX_DATATABLE_EMPTY_MESSAGE',
}
