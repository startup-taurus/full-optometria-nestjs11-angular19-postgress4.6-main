import { CommonModule } from '@angular/common'
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import Swal from 'sweetalert2'
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { FeedbackService } from '@core/services/api/feedback.service'
import { FeedbackItem, FeedbackStatus } from '@core/interfaces/api/feedback.interface'
import { BootstrapModalConfig, ModalWithAction } from '@core/interfaces/ui/bootstrap-modal.interface'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgxDatatableConfig } from '@core/interfaces/ui/ngx-datatable.interface'
import { DEFAULT_NGX_DATATABLE_PAGINATION } from '@core/helpers/ui/ngx-datatable.constant'
import { FORMAT_FOR_DATES, SWAL_DELETE_CONFIRM_CONFIG, SWAL_ERROR_CONFIG, SWAL_SUCCESS_CONFIG } from '@core/helpers/ui/ui.constants'
import { BUTTON_ACTIONS } from '@core/helpers/ui/constants'
import { NgxDatatableComponent } from '../../../../../shared/components/tables/ngx-datatabale/ngx-datatable.component'
import { FeedbackDetailModalComponent } from '../../modals/feedback-detail-modal/feedback-detail-modal.component'

@Component({
  selector: 'app-feedback-table',
  standalone: true,
  imports: [CommonModule, TranslateModule, NgbModule, NgxDatatableComponent],
  templateUrl: './feedback-table.component.html',
})
export class FeedbackTableComponent implements OnInit, OnChanges {
  private readonly feedbackService = inject(FeedbackService)
  private readonly translate = inject(TranslateService)
  private readonly bsModalService = inject(BootstrapModalService<ModalWithAction<{ feedback: FeedbackItem; isAdmin: boolean }>>)

  public BUTTON_ACTIONS = BUTTON_ACTIONS
  public FORMAT_FOR_DATES = FORMAT_FOR_DATES
  private PAGINATION = DEFAULT_NGX_DATATABLE_PAGINATION

  @Input() refreshToken = 0

  @ViewChild('typeTemplate', { static: true }) typeTemplate?: TemplateRef<HTMLElement>
  @ViewChild('statusTemplate', { static: true }) statusTemplate?: TemplateRef<HTMLElement>
  @ViewChild('titleTemplate', { static: true }) titleTemplate?: TemplateRef<HTMLElement>
  @ViewChild('attachmentsTemplate', { static: true }) attachmentsTemplate?: TemplateRef<HTMLElement>
  @ViewChild('createdAtTemplate', { static: true }) createdAtTemplate?: TemplateRef<HTMLElement>
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate?: TemplateRef<HTMLElement>

  public config$ = new BehaviorSubject<Partial<NgxDatatableConfig>>({})
  public data$: Observable<FeedbackItem[]> = of([])
  private filter: object = {}

  ngOnInit(): void {
    this.config$ = this.buildConfig()
    this.reloadDatatable()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshToken'] && !changes['refreshToken'].firstChange) {
      this.reloadDatatable()
    }
  }

  private buildConfig(): BehaviorSubject<Partial<NgxDatatableConfig>> {
    return new BehaviorSubject<Partial<NgxDatatableConfig>>({
      limit: this.PAGINATION.LIMIT,
      page: this.PAGINATION.PAGE,
      columns: [
        { name: 'FEEDBACK.FIELDS.TYPE', cellTemplate: this.typeTemplate ?? undefined, width: 130, sortable: false },
        { name: 'FEEDBACK.FIELDS.TITLE', cellTemplate: this.titleTemplate ?? undefined, width: 260, isPrimary: true },
        { name: 'FEEDBACK.FIELDS.STATUS', cellTemplate: this.statusTemplate ?? undefined, width: 130, sortable: false },
        { name: 'FEEDBACK.FIELDS.ATTACHMENTS', cellTemplate: this.attachmentsTemplate ?? undefined, width: 100, sortable: false, hideOnMobile: true },
        { name: 'FEEDBACK.FIELDS.CREATED_AT', cellTemplate: this.createdAtTemplate ?? undefined, width: 130, hideOnMobile: true },
        { name: 'FEEDBACK.TABLE.ACTIONS', cellTemplate: this.actionsTemplate ?? undefined, width: 140, sortable: false, isActions: true },
      ],
    })
  }

  private fetchItems(): Observable<FeedbackItem[]> {
    this.config$.next({ ...this.config$.value, loadingIndicator: true })
    const params = { ...this.filter, limit: this.config$.value.limit, page: this.config$.value.page }
    return this.feedbackService.getFeedback(params).pipe(
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

  public reloadDatatable(filter: object = {}): void {
    this.filter = filter
    this.config$.next({ ...this.config$.value, limit: this.PAGINATION.LIMIT, page: this.PAGINATION.PAGE })
    this.data$ = this.fetchItems()
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
      data: { buttonAction: BUTTON_ACTIONS.VIEW, selectedRow: { feedback: item, isAdmin: false } },
    }
    this.bsModalService.openModal(config)
  }

  public deleteItem(item: FeedbackItem): void {
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
          this.reloadDatatable(this.filter)
          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            text: this.translate.instant('FEEDBACK.MESSAGES.DELETE_SUCCESS'),
          })
        },
        error: (error) => {
          const message =
            error?.error?.message?.es ||
            this.translate.instant('FEEDBACK.MESSAGES.DELETE_ERROR')

          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            text: message,
          })
        },
      })
    })
  }
}
