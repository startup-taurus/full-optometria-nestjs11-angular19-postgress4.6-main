import { CommonModule } from '@angular/common'
import { Component, inject, OnInit, OnDestroy } from '@angular/core'
import {
  FeedbackItem,
  FeedbackStatus,
} from '@core/interfaces/api/feedback.interface'
import { ModalWithAction } from '@core/interfaces/ui/bootstrap-modal.interface'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'
import { environment } from '@environment/environment'
import { FeedbackService } from '@core/services/api/feedback.service'
import Swal from 'sweetalert2'
import {
  SWAL_ERROR_CONFIG,
  SWAL_SUCCESS_CONFIG,
} from '@core/helpers/ui/ui.constants'

@Component({
  selector: 'app-feedback-detail-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './feedback-detail-modal.component.html',
  styleUrl: './feedback-detail-modal.component.scss',
})
export class FeedbackDetailModalComponent implements OnInit, OnDestroy {
  public selectedFeedback?: FeedbackItem
  public loading = true
  public isAdmin = false
  public updatingStatus = false
  private fileBaseUrl = environment.fileBaseUrl

  public lightboxOpen = false
  public currentImageIndex = 0
  public imageAttachments: any[] = []

  private _activeModal = inject(NgbActiveModal)
  private _bsModalService = inject(
    BootstrapModalService<
      ModalWithAction<{ feedback: FeedbackItem; isAdmin: boolean }>
    >
  )
  private _feedbackService = inject(FeedbackService)
  private _translate = inject(TranslateService)
  private unsubscribe$ = new Subject<boolean>()

  ngOnInit(): void {
    this._bsModalService
      .getDataIssued()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data) => {
        if (data?.selectedRow) {
          this.selectedFeedback = data.selectedRow.feedback
          this.isAdmin = data.selectedRow.isAdmin ?? false
          this.loadFeedbackDetail(data.selectedRow.feedback.id)
        }
      })
  }

  private loadFeedbackDetail(feedbackId: string): void {
    this.loading = true
    this._feedbackService.getFeedbackById(feedbackId).subscribe({
      next: (response) => {
        this.selectedFeedback = response.data ?? this.selectedFeedback
        this.imageAttachments = (
          this.selectedFeedback?.attachments || []
        ).filter((att) => this.isImage(att.mimeType))
        this.loading = false
      },
      error: () => {
        this.loading = false
      },
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(true)
    this.unsubscribe$.complete()
  }

  onClose(): void {
    this._activeModal.dismiss('close')
  }

  getFileUrl(path: string): string {
    let clean = path.replace('/uploads/uploads/', '/uploads/')
    if (clean.startsWith('/')) return this.fileBaseUrl + clean
    return `${this.fileBaseUrl}/${clean}`
  }

  isImage(mimeType: string): boolean {
    return mimeType?.startsWith('image/')
  }

  getStatusBadgeClass(status: FeedbackStatus): string {
    const map: Record<FeedbackStatus, string> = {
      nuevo: 'bg-primary-subtle text-primary-emphasis',
      en_revision: 'bg-warning-subtle text-warning-emphasis',
      resuelto: 'bg-success-subtle text-success-emphasis',
    }
    return map[status] ?? 'bg-secondary-subtle text-secondary-emphasis'
  }

  getTypeBadgeClass(type: string): string {
    return type === 'suggestion'
      ? 'bg-info-subtle text-info-emphasis'
      : 'bg-danger-subtle text-danger-emphasis'
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as FeedbackStatus
    if (!this.selectedFeedback || this.updatingStatus) return
    this.updatingStatus = true
    this._feedbackService
      .updateStatus(this.selectedFeedback.id, value)
      .subscribe({
        next: () => {
          this.selectedFeedback!.status = value
          this.updatingStatus = false
          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            text: this._translate.instant('FEEDBACK.MESSAGES.STATUS_UPDATED'),
          })
        },
        error: (err) => {
          this.updatingStatus = false
          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            text:
              err?.error?.message?.es ??
              this._translate.instant('FEEDBACK.MESSAGES.STATUS_UPDATE_ERROR'),
          })
        },
      })
  }

  getImageIndex(attachment: any): number {
    return this.imageAttachments.findIndex(
      (img) => img.path === attachment.path
    )
  }

  openLightbox(index: number): void {
    if (index < 0) return
    this.currentImageIndex = index
    this.lightboxOpen = true
  }

  closeLightbox(): void {
    this.lightboxOpen = false
  }

  nextImage(): void {
    this.currentImageIndex =
      (this.currentImageIndex + 1) % this.imageAttachments.length
  }

  prevImage(): void {
    this.currentImageIndex =
      (this.currentImageIndex - 1 + this.imageAttachments.length) %
      this.imageAttachments.length
  }

  getCurrentImage(): any {
    return this.imageAttachments[this.currentImageIndex]
  }

  formatDateTime(date: string | undefined): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}
