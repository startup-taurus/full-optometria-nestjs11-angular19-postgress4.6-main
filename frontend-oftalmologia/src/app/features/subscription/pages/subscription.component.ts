import { CommonModule } from '@angular/common'
import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import Swal from 'sweetalert2'
import { PageTitleComponent } from '@/app/shared/components/layouts/page-title/page-title.component'
import { environment } from '@environment/environment'
import {
  SWAL_DELETE_CONFIRM_CONFIG,
  SWAL_ERROR_CONFIG,
  SWAL_SUCCESS_CONFIG,
} from '@core/helpers/ui/ui.constants'
import { selectUser } from '@core/states/auth/auth.selectors'
import { SubscriptionService } from '@core/services/api/subscription.service'
import { CompanySubscription } from '@core/interfaces/api/subscription.interface'

@Component({
  selector: 'subscription-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, PageTitleComponent],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
})
export class SubscriptionComponent implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService)
  private readonly store = inject(Store)
  private readonly destroyRef = inject(DestroyRef)
  private readonly translate = inject(TranslateService)

  @ViewChild('logoInput') logoInput?: ElementRef<HTMLInputElement>

  subscription: CompanySubscription | null = null
  loading = true

  companyId: string | null = null
  companyName = ''
  logoUrl: string | null = null
  uploadingLogo = false
  logoError = ''
  canceling = false

  ngOnInit(): void {
    this.store
      .select(selectUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.companyId = user?.company?.id ?? user?.companyId ?? null
        this.companyName = user?.company?.name ?? ''
        const path = user?.company?.logoFile?.path
        if (path && !this.logoUrl) {
          this.logoUrl = `${environment.fileBaseUrl}/${path}`
        }
      })

    this.subscriptionService
      .getMySubscription()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const raw = response.data as CompanySubscription | null
          this.subscription = raw && raw.id ? raw : null
          this.loading = false
        },
        error: () => {
          this.loading = false
        },
      })
  }

  triggerLogoInput(): void {
    this.logoInput?.nativeElement.click()
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) {
      return
    }
    this.logoError = ''

    if (!file.type.startsWith('image/')) {
      this.logoError = this.translate.instant('SUBSCRIPTION.LOGO_INVALID')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      this.logoError = this.translate.instant('SUBSCRIPTION.LOGO_TOO_BIG')
      return
    }
    if (!this.companyId) {
      return
    }

    this.uploadingLogo = true
    this.subscriptionService
      .uploadCompanyLogo(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const path = res.data?.logoFile?.path
          if (path) {
            this.logoUrl = `${environment.fileBaseUrl}/${path}?t=${Date.now()}`
          }
          this.uploadingLogo = false
          if (this.logoInput) {
            this.logoInput.nativeElement.value = ''
          }
        },
        error: () => {
          this.logoError = this.translate.instant('SUBSCRIPTION.LOGO_ERROR')
          this.uploadingLogo = false
        },
      })
  }

  get isCanceled(): boolean {
    const status = this.subscription?.status
    return status === 'canceled' || status === 'cancelled'
  }

  get canSelfCancel(): boolean {
    return !!this.subscription?.externalSubscriptionId && !this.isCanceled
  }

  get taxBreakdown(): { base: string; tax: string } | null {
    const cents = this.subscription?.amountCents
    if (!this.subscription?.externalSubscriptionId || !cents || cents <= 0) {
      return null
    }
    const baseCents = Math.round(cents / 1.15)
    const taxCents = cents - baseCents
    return {
      base: `$${(baseCents / 100).toFixed(2)}`,
      tax: `$${(taxCents / 100).toFixed(2)}`,
    }
  }

  onCancelSubscription(): void {
    const expectedName = (this.companyName || '').trim()

    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: this.translate.instant('SUBSCRIPTION.CANCEL_CONFIRM_TITLE'),
      html: this.translate.instant('SUBSCRIPTION.CANCEL_CONFIRM_TEXT', {
        company: expectedName,
      }),
      input: 'text',
      inputPlaceholder: expectedName,
      inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
      confirmButtonText: this.translate.instant('SUBSCRIPTION.CANCEL_YES'),
      cancelButtonText: this.translate.instant('SUBSCRIPTION.CANCEL_NO'),
      preConfirm: (value: string) => {
        if ((value || '').trim() !== expectedName) {
          Swal.showValidationMessage(
            this.translate.instant('SUBSCRIPTION.CANCEL_NAME_MISMATCH')
          )
          return false
        }
        return true
      },
    }).then((result) => {
      if (!result.isConfirmed) {
        return
      }
      this.canceling = true
      this.subscriptionService
        .cancelMySubscription()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.canceling = false
            if (res.data) {
              this.subscription = res.data
            }
            Swal.fire({
              ...SWAL_SUCCESS_CONFIG,
              title: this.translate.instant('SUBSCRIPTION.CANCELED_OK'),
            })
          },
          error: () => {
            this.canceling = false
            Swal.fire({
              ...SWAL_ERROR_CONFIG,
              title: this.translate.instant('SUBSCRIPTION.CANCEL_ERROR'),
            })
          },
        })
    })
  }

  statusBadgeClass(status: string | undefined): string {
    switch (status) {
      case 'active':
        return 'bg-success'
      case 'past_due':
        return 'bg-warning text-dark'
      case 'canceled':
      case 'cancelled':
        return 'bg-danger'
      case 'paused':
        return 'bg-secondary'
      default:
        return 'bg-secondary'
    }
  }

  statusLabelKey(status: string | undefined): string {
    switch (status) {
      case 'active':
        return 'SUBSCRIPTION.STATUS_ACTIVE'
      case 'past_due':
        return 'SUBSCRIPTION.STATUS_PAST_DUE'
      case 'canceled':
      case 'cancelled':
        return 'SUBSCRIPTION.STATUS_CANCELED'
      case 'paused':
        return 'SUBSCRIPTION.STATUS_PAUSED'
      default:
        return 'SUBSCRIPTION.STATUS'
    }
  }
}
