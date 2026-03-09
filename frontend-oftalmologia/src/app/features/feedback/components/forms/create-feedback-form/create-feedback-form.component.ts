import { CommonModule } from '@angular/common'
import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  inject,
} from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import Swal from 'sweetalert2'
import { FeedbackService } from '@core/services/api/feedback.service'
import {
  SWAL_ERROR_CONFIG,
  SWAL_SUCCESS_CONFIG,
} from '@core/helpers/ui/ui.constants'

interface FilePreview {
  file: File
  previewUrl: string | null
  isImage: boolean
}

const MAX_FILES = 3
const MAX_SIZE_MB = 10

@Component({
  selector: 'app-create-feedback-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './create-feedback-form.component.html',
})
export class CreateFeedbackFormComponent {
  private readonly fb = inject(FormBuilder)
  private readonly feedbackService = inject(FeedbackService)
  private readonly translate = inject(TranslateService)

  @Output() feedbackCreated = new EventEmitter<void>()
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>

  isSubmitting = false
  filePreviews: FilePreview[] = []
  readonly maxFiles = MAX_FILES

  form = this.fb.group({
    title: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(180)],
    ],
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5000),
      ],
    ],
    type: ['suggestion', [Validators.required]],
  })

  get selectedFiles(): File[] {
    return this.filePreviews.map((p) => p.file)
  }

  get canAddMore(): boolean {
    return this.filePreviews.length < MAX_FILES
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click()
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    input.value = ''

    const remaining = MAX_FILES - this.filePreviews.length
    const toAdd = files.slice(0, remaining)

    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          ...SWAL_ERROR_CONFIG,
          text: this.translate.instant('FEEDBACK.MESSAGES.ONLY_IMAGES_ALLOWED'),
        })
        continue
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        Swal.fire({
          ...SWAL_ERROR_CONFIG,
          text: this.translate.instant('FEEDBACK.MESSAGES.FILE_TOO_LARGE', {
            name: file.name,
            max: MAX_SIZE_MB,
          }),
        })
        continue
      }

      const isImage = file.type.startsWith('image/')
      const preview: FilePreview = { file, previewUrl: null, isImage }

      if (isImage) {
        const reader = new FileReader()
        reader.onload = (e) => {
          preview.previewUrl = (e.target as FileReader).result as string
        }
        reader.readAsDataURL(file)
      }

      this.filePreviews.push(preview)
    }

    if (files.length > remaining) {
      Swal.fire({
        ...SWAL_ERROR_CONFIG,
        text: this.translate.instant('FEEDBACK.MESSAGES.MAX_FILES_ERROR'),
      })
    }
  }

  removeFile(index: number): void {
    this.filePreviews.splice(index, 1)
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field)
    return !!(control && control.invalid && control.touched)
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched()
      return
    }

    const { title, description, type } = this.form.getRawValue()

    this.isSubmitting = true
    this.feedbackService
      .createFeedback({
        title: title || '',
        description: description || '',
        type: type || 'suggestion',
        files: this.selectedFiles,
      })
      .subscribe({
        next: () => {
          this.form.reset({ type: 'suggestion' })
          this.filePreviews = []
          this.feedbackCreated.emit()
          Swal.fire({
            ...SWAL_SUCCESS_CONFIG,
            text: this.translate.instant('FEEDBACK.MESSAGES.CREATED_SUCCESS'),
          })
          this.isSubmitting = false
        },
        error: (error) => {
          const message =
            error?.error?.message?.es ||
            this.translate.instant('FEEDBACK.MESSAGES.CREATED_ERROR')

          Swal.fire({
            ...SWAL_ERROR_CONFIG,
            text: message,
          })
          this.isSubmitting = false
        },
      })
  }
}
