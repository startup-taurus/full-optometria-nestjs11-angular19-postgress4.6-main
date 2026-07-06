import { CommonModule } from '@angular/common'
import { Component, Input, OnInit } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { SubscriptionAdminService } from '@core/services/api/subscription-admin.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import {
  AdminSubscriptionRow,
  ManageSubscriptionPayload,
  Plan,
} from '@core/interfaces/api/subscription.interface'

@Component({
  selector: 'app-manage-subscription-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './manage-subscription-modal.component.html',
  styleUrls: ['./manage-subscription-modal.component.scss'],
})
export class ManageSubscriptionModalComponent implements OnInit {
  @Input() row!: AdminSubscriptionRow
  @Input() plans: Plan[] = []

  form!: FormGroup
  formLoading = false

  readonly statuses = ['active', 'past_due', 'paused']

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly activeModal: NgbActiveModal,
    private readonly subscriptionAdminService: SubscriptionAdminService,
    private readonly notificationService: ToastrNotificationService
  ) {}

  ngOnInit(): void {
    const subscription = this.row.subscription
    const incomingStatus = subscription?.status ?? 'active'
    const initialStatus = this.statuses.includes(incomingStatus)
      ? incomingStatus
      : 'active'
    this.form = this.formBuilder.group({
      planCode: [subscription?.planCode ?? ''],
      status: [initialStatus, Validators.required],
      currentPeriodEnd: [this.toDateInput(subscription?.currentPeriodEnd)],
      amountUsd: [
        subscription?.amountCents != null
          ? subscription.amountCents / 100
          : null,
        [Validators.min(0)],
      ],
    })
  }

  onPlanChange(): void {
    const code = this.form.get('planCode')?.value
    const plan = this.plans.find((item) => item.code === code)
    if (plan) {
      this.form.patchValue({ amountUsd: plan.amountCents / 100 })
    }
  }

  get isLanding(): boolean {
    return this.row?.subscription?.source === 'landing'
  }

  get isCanceled(): boolean {
    const status = this.row?.subscription?.status
    return status === 'canceled' || status === 'cancelled'
  }

  get isCompanyActive(): boolean {
    return this.row?.company?.isActive !== false
  }

  extendPeriod(days: number): void {
    const control = this.form.get('currentPeriodEnd')
    if (!control) {
      return
    }
    const parsed = control.value
      ? new Date(`${control.value}T00:00:00Z`)
      : new Date()
    const base = isNaN(parsed.getTime()) ? new Date() : parsed
    base.setUTCDate(base.getUTCDate() + days)
    control.setValue(this.toDateInput(base.toISOString()))
    control.markAsDirty()
  }

  requestCancel(): void {
    this.activeModal.close('cancel')
  }

  requestReactivate(): void {
    this.activeModal.close('reactivate')
  }

  // Desactivar/activar la EMPRESA (bloquea/permite login). Distinto de cancelar el cobro.
  requestDeactivateCompany(): void {
    this.activeModal.close('deactivate')
  }

  requestActivateCompany(): void {
    this.activeModal.close('activate')
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
        return 'bg-light text-dark border'
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
        return 'SUBSCRIPTION_ADMIN.STATUS_NONE'
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    const raw = this.form.value
    const payload: ManageSubscriptionPayload = {
      status: raw.status,
    }
    if (raw.planCode) {
      payload.planCode = raw.planCode
    }
    if (raw.currentPeriodEnd) {
      payload.currentPeriodEnd = new Date(raw.currentPeriodEnd).toISOString()
    }
    if (raw.amountUsd !== null && raw.amountUsd !== '' && !isNaN(raw.amountUsd)) {
      payload.amountCents = Math.round(Number(raw.amountUsd) * 100)
    }

    this.formLoading = true
    this.subscriptionAdminService
      .manage(this.row.company.id, payload)
      .subscribe({
        next: () => {
          this.formLoading = false
          this.notificationService.showNotification({
            title: 'SUBSCRIPTION_ADMIN.TITLE',
            message: 'SUBSCRIPTION_ADMIN.SAVED',
            type: 'success',
          })
          this.activeModal.close('updated')
        },
        error: () => {
          this.formLoading = false
        },
      })
  }

  closeModal(): void {
    this.activeModal.dismiss()
  }

  private toDateInput(iso?: string | null): string {
    if (!iso) {
      return ''
    }
    const date = new Date(iso)
    if (isNaN(date.getTime())) {
      return ''
    }
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
    const day = `${date.getUTCDate()}`.padStart(2, '0')
    return `${date.getUTCFullYear()}-${month}-${day}`
  }
}
