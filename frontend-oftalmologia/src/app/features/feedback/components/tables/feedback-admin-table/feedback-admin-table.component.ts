import { CommonModule } from '@angular/common'
import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import Swal from 'sweetalert2'
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { FeedbackService } from '@core/services/api/feedback.service'
import {
  FeedbackItem,
  FeedbackStatus,
  FeedbackType,
} from '@core/interfaces/api/feedback.interface'
import { BootstrapModalConfig, ModalWithAction } from '@core/interfaces/ui/bootstrap-modal.interface'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgxDatatableConfig } from '@core/interfaces/ui/ngx-datatable.interface'
import { DEFAULT_NGX_DATATABLE_PAGINATION } from '@core/helpers/ui/ngx-datatable.constant'
import { FORMAT_FOR_DATES, SWAL_DELETE_CONFIRM_CONFIG, SWAL_ERROR_CONFIG, SWAL_SUCCESS_CONFIG } from '@core/helpers/ui/ui.constants'
import { BUTTON_ACTIONS } from '@core/helpers/ui/constants'
import { NgxDatatableComponent } from '../../../../../shared/components/tables/ngx-datatabale/ngx-datatable.component'
import { FeedbackDetailModalComponent } from '../../modals/feedback-detail-modal/feedback-detail-modal.component'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-feedback-admin-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NgbModule, NgxDatatableComponent],
  templateUrl: './feedback-admin-table.component.html',
})
export class FeedbackAdminTableComponent implements OnInit {
  private readonly feedbackService = inject(FeedbackService)
  private readonly translate = inject(TranslateService)
  private readonly bsModalService = inject(BootstrapModalService<ModalWithAction<{ feedback: FeedbackItem; isAdmin: boolean }>>)

  public BUTTON_ACTIONS = BUTTON_ACTIONS
  public FORMAT_FOR_DATES = FORMAT_FOR_DATES
  private PAGINATION = DEFAULT_NGX_DATATABLE_PAGINATION

  @ViewChild('companyTemplate', { static: true }) companyTemplate?: TemplateRef<HTMLElement>
  @ViewChild('userTemplate', { static: true }) userTemplate?: TemplateRef<HTMLElement>
  @ViewChild('typeTemplate', { static: true }) typeTemplate?: TemplateRef<HTMLElement>
  @ViewChild('titleTemplate', { static: true }) titleTemplate?: TemplateRef<HTMLElement>
  @ViewChild('statusTemplate', { static: true }) statusTemplate?: TemplateRef<HTMLElement>
  @ViewChild('createdAtTemplate', { static: true }) createdAtTemplate?: TemplateRef<HTMLElement>
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate?: TemplateRef<HTMLElement>

  public config$ = new BehaviorSubject<Partial<NgxDatatableConfig>>({})
  public data$: Observable<FeedbackItem[]> = of([])

  filters: { search: string; type: FeedbackType | ''; status: FeedbackStatus | '' } = {
    search: '',
    type: '',
    status: '',
  }

  ngOnInit(): void {
    this.config$ = this.buildConfig()
    this.reloadDatatable()
  }

  private buildConfig(): BehaviorSubject<Partial<NgxDatatableConfig>> {
    return new BehaviorSubject<Partial<NgxDatatableConfig>>({
      limit: this.PAGINATION.LIMIT,
      page: this.PAGINATION.PAGE,
      columns: [
        { name: 'FEEDBACK.FIELDS.COMPANY', cellTemplate: this.companyTemplate ?? undefined, width: 150, sortable: false },
        { name: 'FEEDBACK.FIELDS.USER', cellTemplate: this.userTemplate ?? undefined, width: 160, sortable: false, isPrimary: true },
        { name: 'FEEDBACK.FIELDS.TYPE', cellTemplate: this.typeTemplate ?? undefined, width: 120, sortable: false },
        { name: 'FEEDBACK.FIELDS.TITLE', cellTemplate: this.titleTemplate ?? undefined, width: 240, isPrimary: true },
        { name: 'FEEDBACK.FIELDS.STATUS', cellTemplate: this.statusTemplate ?? undefined, width: 130, sortable: false },
        { name: 'FEEDBACK.FIELDS.CREATED_AT', cellTemplate: this.createdAtTemplate ?? undefined, width: 130, hideOnMobile: true },
        { name: 'FEEDBACK.TABLE.ACTIONS', cellTemplate: this.actionsTemplate ?? undefined, width: 140, sortable: false, isActions: true },
      ],
    })
  }

  private buildFilter(): object {
    const filter: Record<string, string | number> = {
      page: this.config$.value.page ?? this.PAGINATION.PAGE,
      limit: this.config$.value.limit ?? this.PAGINATION.LIMIT,
    }
    if (this.filters.search) filter['search'] = this.filters.search
    if (this.filters.type) filter['type'] = this.filters.type
    if (this.filters.status) filter['status'] = this.filters.status
    return filter
  }

  private fetchItems(): Observable<FeedbackItem[]> {
    this.config$.next({ ...this.config$.value, loadingIndicator: true })
    return this.feedbackService.getFeedbackAdmin(this.buildFilter() as any).pipe(
      tap((res) => {
        this.config$.next({ ...this.config$.value, loadingIndicator: false, count: res.data?.totalCount })
      }),
      map((res) => res.data?.result || []),
      catchError(() => {
        this.config$.next({ ...this.config$.value, loadingIndicator: false })
        return of([])
      })
    )
  }

  public reloadDatatable(): void {
    this.config$.next({ ...this.config$.value, limit: this.PAGINATION.LIMIT, page: this.PAGINATION.PAGE })
    this.data$ = this.fetchItems()
  }

  public applyFilters(): void {
    this.reloadDatatable()
  }

  public clearFilters(): void {
    this.filters = { search: '', type: '', status: '' }
    this.reloadDatatable()
  }

  public hasActiveFilters(): boolean {
    return !!(this.filters.search || this.filters.type || this.filters.status)
  }

  public onChangeLimit(limit: number): void {
    this.config$.next({ ...this.config$.value, limit, page: this.PAGINATION.PAGE })
    this.data$ = this.fetchItems()
  }

  public onChangePage(page: number): void {
    this.config$.next({ ...this.config$.value, page })
    this.data$ = this.fetchItems()
  }

  public getStatusBadgeClass(status: FeedbackStatus): string {
    const map: Record<FeedbackStatus, string> = {
      nuevo: 'bg-primary',
      en_revision: 'bg-warning',
      resuelto: 'bg-success',
    }
    return map[status] ?? 'bg-secondary'
  }

  public getTypeBadgeClass(type: string): string {
    return type === 'suggestion' ? 'bg-info' : 'bg-danger'
  }

  public openDetail(item: FeedbackItem): void {
    const config: BootstrapModalConfig<ModalWithAction<{ feedback: FeedbackItem; isAdmin: boolean }>> = {
      component: FeedbackDetailModalComponent,
      options: { size: 'lg', backdrop: 'static', centered: true },
      data: { buttonAction: BUTTON_ACTIONS.VIEW, selectedRow: { feedback: item, isAdmin: true } },
    }
    const ref = this.bsModalService.openModal(config)
    if (ref) {
      ref.closed.subscribe(() => this.reloadDatatable())
    }
  }

  public remove(item: FeedbackItem): void {
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: this.translate.instant('FEEDBACK.MESSAGES.DELETE_CONFIRM_TITLE'),
      text: this.translate.instant('FEEDBACK.MESSAGES.DELETE_CONFIRM_TEXT'),
      confirmButtonText: this.translate.instant('COMMON.DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
    }).then((result) => {
      if (!result.isConfirmed) return

      this.feedbackService.removeFeedback(item.id).subscribe({
        next: () => {
          this.reloadDatatable()
          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            text: this.translate.instant('FEEDBACK.MESSAGES.DELETE_SUCCESS'),
          })
        },
        error: (error) => {
          const message =
            error?.error?.message?.es ||
            this.translate.instant('FEEDBACK.MESSAGES.DELETE_ERROR')
          Swal.fire({ ...SWAL_ERROR_CONFIG, text: message })
        },
      })
    })
  }
}
