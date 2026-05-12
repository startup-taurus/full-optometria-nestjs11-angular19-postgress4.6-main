import { CommonModule } from '@angular/common'
import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ElementRef,
} from '@angular/core'
import { Overlay, OverlayRef } from '@angular/cdk/overlay'
import { TemplatePortal } from '@angular/cdk/portal'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { HttpClient } from '@angular/common/http'
import { environment } from '@environment/environment'
import { BUTTON_ACTIONS } from '@core/helpers/ui/constants'
import { Client } from '@core/interfaces/api/client.interface'
import { Patient } from '@core/interfaces/api/patient.interface'
import { ButtonAction } from '@core/interfaces/ui/ui.interface'
import { ModalWithAction } from '@core/interfaces/ui/bootstrap-modal.interface'
import { ClientsService } from '@core/services/api/clients.service'
import { PatientService } from '@core/services/api/patient.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { Subject, takeUntil, firstValueFrom } from 'rxjs'
import { ClientModalComponent } from '../../../laboratoy-orders/components/modals/client-modal/client-modal.component'
import Swal from 'sweetalert2'
import { ClinicalHistoryUpsertModalComponent } from '../../../medical-history/components/modals/clinical-history-upsert-modal.component'
import { ShiftModalComponent } from '../../../shift-management/components/modals/shift-modal/shift-modal.component'

@Component({
  selector: 'app-patient-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './patient-form-modal.component.html',
  styleUrls: ['./patient-form-modal.component.scss'],
})
export class PatientFormModalComponent implements OnInit, OnDestroy {
  @ViewChild('photoInput') photoInput!: ElementRef
  @Output() patientCreated = new EventEmitter<Patient>()
  @Output() patientUpdated = new EventEmitter<Patient>()

  public patientForm!: FormGroup
  public buttonAction: ButtonAction = BUTTON_ACTIONS.ADD
  public selectedPatient?: Patient
  public loading = false
  public isEditMode = false
  public modalTitle = ''
  public readonly commonEmailDomains = [
    '@gmail.com',
    '@hotmail.com',
    '@outlook.com',
    '@yahoo.com',
    '@live.com',
    '@icloud.com',
    '@protonmail.com',
  ]
  public readonly manualEmailDomainValue = 'manual'

  public selectedPhotoFile: File | null = null
  public photoPreviewUrl: string | null = null
  public uploadedPhotoFileId: string | null = null
  public photoMarkedForDeletion = false
  public clients: Client[] = []
  public clientsLoading = false
  public readonly birthDayOptions = Array.from({ length: 31 }, (_, index) =>
    String(index + 1).padStart(2, '0')
  )
  public readonly birthMonthOptions: { value: string; labelKey: string }[] = [
    { value: '01', labelKey: 'CALENDAR.MONTHS.JANUARY' },
    { value: '02', labelKey: 'CALENDAR.MONTHS.FEBRUARY' },
    { value: '03', labelKey: 'CALENDAR.MONTHS.MARCH' },
    { value: '04', labelKey: 'CALENDAR.MONTHS.APRIL' },
    { value: '05', labelKey: 'CALENDAR.MONTHS.MAY' },
    { value: '06', labelKey: 'CALENDAR.MONTHS.JUNE' },
    { value: '07', labelKey: 'CALENDAR.MONTHS.JULY' },
    { value: '08', labelKey: 'CALENDAR.MONTHS.AUGUST' },
    { value: '09', labelKey: 'CALENDAR.MONTHS.SEPTEMBER' },
    { value: '10', labelKey: 'CALENDAR.MONTHS.OCTOBER' },
    { value: '11', labelKey: 'CALENDAR.MONTHS.NOVEMBER' },
    { value: '12', labelKey: 'CALENDAR.MONTHS.DECEMBER' },
  ]
  public birthYearOptions: string[] = []
  public isMobile = false
  public wheelPickerOpen = false
  public wheelPickerMode: 'exact' | 'yearOnly' = 'exact'
  public wheelTempDay = ''
  public wheelTempMonth = ''
  public wheelTempYear = ''
  public wheelTempYearOnly = ''
  public readonly WHEEL_ITEM_HEIGHT = 44

  @ViewChild('wheelDayCol') wheelDayCol?: ElementRef<HTMLDivElement>
  @ViewChild('wheelMonthCol') wheelMonthCol?: ElementRef<HTMLDivElement>
  @ViewChild('wheelYearCol') wheelYearCol?: ElementRef<HTMLDivElement>
  @ViewChild('wheelYearOnlyCol') wheelYearOnlyCol?: ElementRef<HTMLDivElement>
  @ViewChild('wheelPickerTpl') wheelPickerTpl?: TemplateRef<unknown>

  private fileBaseUrl: string = environment.fileBaseUrl
  private wheelScrollTimers: Record<string, ReturnType<typeof setTimeout> | null> = {
    day: null,
    month: null,
    year: null,
    yearOnly: null,
  }
  private wheelOverlayRef: OverlayRef | null = null
  private _overlay = inject(Overlay)
  private _viewContainerRef = inject(ViewContainerRef)

  private unsubscribe$ = new Subject<void>()
  private openClientAfterCreate = false
  private hasClientChanges = false

  private _formBuilder = inject(FormBuilder)
  private _clientsService = inject(ClientsService)
  private _modalService = inject(NgbModal)
  private _notificationService = inject(ToastrNotificationService)
  private _patientService = inject(PatientService)
  private _activeModal = inject(NgbActiveModal)
  private _bsModalService = inject(
    BootstrapModalService<ModalWithAction<Patient>>
  )
  private _http = inject(HttpClient)

  ngOnInit(): void {
    this.generateBirthYearOptions()
    this.initializeForm()
    this.updateMobileFlag()
    this.setModalTitle()

    this._bsModalService
      .getDataIssued()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: ModalWithAction<Patient>) => {
        this.setModalData(data)
      })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
    if (this.wheelOverlayRef) {
      this.wheelOverlayRef.dispose()
      this.wheelOverlayRef = null
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateMobileFlag()
  }

  private updateMobileFlag(): void {
    this.isMobile = window.innerWidth < 768
    if (!this.isMobile && this.wheelPickerOpen) {
      this.wheelPickerOpen = false
    }
  }

  public setModalData(data: ModalWithAction<Patient>): void {
    this.buttonAction = data.buttonAction
    this.selectedPatient = data.selectedRow
    this.isEditMode = this.buttonAction === BUTTON_ACTIONS.EDIT

    this.initializeForm()
    this.resetPhotoState()

    if (this.isEditMode && data.selectedRow) {
      this.populateForm()
      this.loadClients()
      this.hasClientChanges = false
      this.loading = false
    } else {
      this.clients = []
      this.hasClientChanges = false
      this.loading = false
    }

    this.setModalTitle()
  }

  private setModalTitle(): void {
    switch (this.buttonAction) {
      case BUTTON_ACTIONS.ADD:
        this.modalTitle = 'PATIENT.MODAL.CREATE_TITLE'
        break
      case BUTTON_ACTIONS.EDIT:
        this.modalTitle = 'PATIENT.MODAL.EDIT_TITLE'
        break
      case BUTTON_ACTIONS.VIEW:
        this.modalTitle = 'PATIENT.MODAL.VIEW_TITLE'
        break
      default:
        this.modalTitle = 'PATIENT.MODAL.TITLE'
    }
  }

  private initializeForm(): void {
    const baseFormConfig: any = {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      emailLocalPart: [''],
      emailDomain: ['@gmail.com'],
      emailCustomDomain: [''],
      documentNumber: [''],
      birthMode: ['exact'],
      birthDay: [''],
      birthMonth: [''],
      birthYear: [''],
      birthYearOnly: [''],
      mobilePhone: ['', [Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      homePhone: [''],
      address: [''],
    }

    if (this.isEditMode) {
      baseFormConfig.isActive = [true]
    }

    this.patientForm = this._formBuilder.group(baseFormConfig)
  }

  private populateForm(): void {
    if (this.selectedPatient) {
      const emailParts = this.parseEmailForForm(this.selectedPatient.email)

      if (this.selectedPatient.profilePhoto) {
        this.photoPreviewUrl = this.formatUrl(this.selectedPatient.profilePhoto)
        this.uploadedPhotoFileId = this.selectedPatient.profilePhoto
      } else {
        this.photoPreviewUrl = null
        this.uploadedPhotoFileId = null
      }

      const birthParts = this.buildBirthFormParts(
        this.selectedPatient.dateOfBirth,
        this.selectedPatient.birthYear
      )

      const formData = {
        firstName: this.selectedPatient.firstName,
        lastName: this.selectedPatient.lastName,
        emailLocalPart: emailParts.localPart,
        emailDomain: emailParts.domain,
        emailCustomDomain: emailParts.customDomain,
        documentNumber: this.selectedPatient.documentNumber || '',
        birthMode: birthParts.birthMode,
        birthDay: birthParts.birthDay,
        birthMonth: birthParts.birthMonth,
        birthYear: birthParts.birthYear,
        birthYearOnly: birthParts.birthYearOnly,
        address: this.selectedPatient.address || '',
        homePhone: this.selectedPatient.homePhone || '',
        mobilePhone: this.selectedPatient.mobilePhone || '',
        isActive: this.selectedPatient.isActive ?? true,
      }

      this.patientForm.patchValue(formData)
    }
  }

  private buildBirthFormParts(
    dateOfBirth?: Date | string | null,
    birthYear?: number | null
  ): {
    birthMode: 'exact' | 'yearOnly'
    birthDay: string
    birthMonth: string
    birthYear: string
    birthYearOnly: string
  } {
    const parsedDate = this.parseDateInputValue(dateOfBirth)
    if (parsedDate) {
      return {
        birthMode: 'exact',
        birthDay: String(parsedDate.getUTCDate()).padStart(2, '0'),
        birthMonth: String(parsedDate.getUTCMonth() + 1).padStart(2, '0'),
        birthYear: String(parsedDate.getUTCFullYear()),
        birthYearOnly: '',
      }
    }

    if (birthYear !== null && birthYear !== undefined && Number(birthYear) > 0) {
      return {
        birthMode: 'yearOnly',
        birthDay: '',
        birthMonth: '',
        birthYear: '',
        birthYearOnly: String(birthYear),
      }
    }

    return {
      birthMode: 'exact',
      birthDay: '',
      birthMonth: '',
      birthYear: '',
      birthYearOnly: '',
    }
  }

  public onBirthModeChange(mode: 'exact' | 'yearOnly'): void {
    this.patientForm.patchValue({ birthMode: mode })
    if (mode === 'exact') {
      this.patientForm.patchValue({ birthYearOnly: '' })
    } else {
      this.patientForm.patchValue({
        birthDay: '',
        birthMonth: '',
        birthYear: '',
      })
    }
  }

  public openBirthWheelPicker(): void {
    if (!this.wheelPickerTpl) return
    const mode = this.patientForm.get('birthMode')?.value as 'exact' | 'yearOnly'
    this.wheelPickerMode = mode
    const fallbackYear = String(new Date().getFullYear() - 25)
    const defaultMonth = this.birthMonthOptions[0]?.value ?? '01'
    const defaultDay = this.birthDayOptions[0] ?? '01'

    if (mode === 'exact') {
      this.wheelTempDay = this.patientForm.get('birthDay')?.value || defaultDay
      this.wheelTempMonth = this.patientForm.get('birthMonth')?.value || defaultMonth
      this.wheelTempYear = this.patientForm.get('birthYear')?.value || fallbackYear
      this.wheelTempDay = this.clampDayToMonth(
        this.wheelTempDay,
        this.wheelTempMonth,
        this.wheelTempYear
      )
    } else {
      this.wheelTempYearOnly =
        this.patientForm.get('birthYearOnly')?.value || fallbackYear
    }

    this.wheelPickerOpen = true

    this.wheelOverlayRef = this._overlay.create({
      hasBackdrop: true,
      backdropClass: 'birth-wheel-backdrop',
      panelClass: 'birth-wheel-panel',
      positionStrategy: this._overlay
        .position()
        .global()
        .centerHorizontally()
        .bottom('0'),
      scrollStrategy: this._overlay.scrollStrategies.block(),
      width: '100%',
      maxWidth: '520px',
    })

    const portal = new TemplatePortal(
      this.wheelPickerTpl,
      this._viewContainerRef
    )
    this.wheelOverlayRef.attach(portal)
    this.wheelOverlayRef.backdropClick().subscribe(() => this.closeBirthWheelPicker())

    setTimeout(() => this.scrollWheelsToValues(), 80)
  }

  public closeBirthWheelPicker(): void {
    this.wheelPickerOpen = false
    if (this.wheelOverlayRef) {
      this.wheelOverlayRef.dispose()
      this.wheelOverlayRef = null
    }
  }

  public confirmBirthWheelPicker(): void {
    if (this.wheelPickerMode === 'exact') {
      const safeDay = this.clampDayToMonth(
        this.wheelTempDay,
        this.wheelTempMonth,
        this.wheelTempYear
      )
      this.patientForm.patchValue({
        birthDay: safeDay,
        birthMonth: this.wheelTempMonth,
        birthYear: this.wheelTempYear,
      })
    } else {
      this.patientForm.patchValue({ birthYearOnly: this.wheelTempYearOnly })
    }
    this.closeBirthWheelPicker()
  }

  public onWheelScroll(
    part: 'day' | 'month' | 'year' | 'yearOnly',
    event: Event
  ): void {
    const target = event.target as HTMLDivElement
    if (this.wheelScrollTimers[part]) {
      clearTimeout(this.wheelScrollTimers[part] as ReturnType<typeof setTimeout>)
    }
    this.wheelScrollTimers[part] = setTimeout(() => {
      const idx = Math.round(target.scrollTop / this.WHEEL_ITEM_HEIGHT)
      if (part === 'day') {
        const days = this.getDaysForMonth(this.wheelTempMonth, this.wheelTempYear)
        this.wheelTempDay = days[idx] || days[days.length - 1] || ''
      } else if (part === 'month') {
        this.wheelTempMonth = this.birthMonthOptions[idx]?.value || ''
        this.wheelTempDay = this.clampDayToMonth(
          this.wheelTempDay,
          this.wheelTempMonth,
          this.wheelTempYear
        )
        this.realignDayWheelIfNeeded()
      } else if (part === 'year') {
        this.wheelTempYear = this.birthYearOptions[idx] || ''
        this.wheelTempDay = this.clampDayToMonth(
          this.wheelTempDay,
          this.wheelTempMonth,
          this.wheelTempYear
        )
        this.realignDayWheelIfNeeded()
      } else {
        this.wheelTempYearOnly = this.birthYearOptions[idx] || ''
      }
    }, 80)
  }

  public getWheelDayOptions(): string[] {
    return this.getDaysForMonth(this.wheelTempMonth, this.wheelTempYear)
  }

  private getDaysForMonth(month: string, year: string): string[] {
    const max = this.getMaxDaysInMonth(month, year)
    return Array.from({ length: max }, (_, i) =>
      String(i + 1).padStart(2, '0')
    )
  }

  private getMaxDaysInMonth(month: string, year: string): number {
    const m = Number(month)
    const y = Number(year)
    if (!m || m < 1 || m > 12) return 31
    if (m === 2) {
      const leap = !!y && y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)
      return leap ? 29 : 28
    }
    return [4, 6, 9, 11].includes(m) ? 30 : 31
  }

  private clampDayToMonth(day: string, month: string, year: string): string {
    if (!day) return day
    const dayNum = Number(day)
    if (!dayNum) return day
    const max = this.getMaxDaysInMonth(month, year)
    const clamped = Math.min(dayNum, max)
    return String(clamped).padStart(2, '0')
  }

  private realignDayWheelIfNeeded(): void {
    if (!this.wheelDayCol) return
    const days = this.getDaysForMonth(this.wheelTempMonth, this.wheelTempYear)
    const idx = Math.max(0, days.indexOf(this.wheelTempDay))
    const target = idx * this.WHEEL_ITEM_HEIGHT
    if (Math.abs(this.wheelDayCol.nativeElement.scrollTop - target) > 4) {
      this.wheelDayCol.nativeElement.scrollTo({ top: target, behavior: 'smooth' })
    }
  }

  public getFormattedExactBirth(): string {
    const day = this.patientForm.get('birthDay')?.value
    const month = this.patientForm.get('birthMonth')?.value
    const year = this.patientForm.get('birthYear')?.value
    if (!day || !month || !year) return ''
    return `${day}/${month}/${year}`
  }

  public getMonthLabelKey(monthValue: string): string {
    return (
      this.birthMonthOptions.find((m) => m.value === monthValue)?.labelKey || ''
    )
  }

  private scrollWheelsToValues(): void {
    if (this.wheelPickerMode === 'exact') {
      const dayOptions = this.getDaysForMonth(
        this.wheelTempMonth,
        this.wheelTempYear
      )
      this.scrollWheelToValue(this.wheelDayCol, dayOptions, this.wheelTempDay)
      this.scrollWheelToValue(
        this.wheelMonthCol,
        this.birthMonthOptions.map((m) => m.value),
        this.wheelTempMonth
      )
      this.scrollWheelToValue(this.wheelYearCol, this.birthYearOptions, this.wheelTempYear)
    } else {
      this.scrollWheelToValue(
        this.wheelYearOnlyCol,
        this.birthYearOptions,
        this.wheelTempYearOnly
      )
    }
  }

  private scrollWheelToValue(
    col: ElementRef<HTMLDivElement> | undefined,
    options: string[],
    value: string
  ): void {
    if (!col) return
    const idx = Math.max(0, options.indexOf(value))
    col.nativeElement.scrollTop = idx * this.WHEEL_ITEM_HEIGHT
  }

  public onBirthPartInput(
    controlName: 'birthDay' | 'birthMonth' | 'birthYear' | 'birthYearOnly',
    event: Event
  ): void {
    const input = event.target as HTMLInputElement
    const maxLength = controlName === 'birthYear' || controlName === 'birthYearOnly' ? 4 : 2
    const sanitized = (input.value || '').replace(/\D/g, '').slice(0, maxLength)
    if (sanitized !== input.value) {
      input.value = sanitized
    }
    this.patientForm.get(controlName)?.setValue(sanitized, { emitEvent: false })
  }

  public onBirthPartBlur(
    controlName: 'birthDay' | 'birthMonth' | 'birthYear' | 'birthYearOnly'
  ): void {
    const control = this.patientForm.get(controlName)
    if (!control) return

    const raw = String(control.value ?? '').trim()
    if (!raw) {
      control.setValue('', { emitEvent: false })
      return
    }

    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      control.setValue('', { emitEvent: false })
      return
    }

    let normalized = raw
    if (controlName === 'birthDay') {
      const month = this.patientForm.get('birthMonth')?.value || ''
      const year = this.patientForm.get('birthYear')?.value || ''
      const maxDay = this.getMaxDaysInMonth(month, year)
      const clamped = Math.min(maxDay, Math.max(1, parsed))
      normalized = String(clamped).padStart(2, '0')
    } else if (controlName === 'birthMonth') {
      const clamped = Math.min(12, Math.max(1, parsed))
      normalized = String(clamped).padStart(2, '0')
    } else {
      const currentYear = new Date().getFullYear()
      const clamped = Math.min(currentYear, Math.max(1900, parsed))
      normalized = String(clamped)
    }

    control.setValue(normalized, { emitEvent: false })

    if (controlName === 'birthMonth' || controlName === 'birthYear') {
      this.reclampDesktopDay()
    }
  }

  private reclampDesktopDay(): void {
    const dayCtrl = this.patientForm.get('birthDay')
    if (!dayCtrl) return
    const current = String(dayCtrl.value ?? '').trim()
    if (!current) return
    const month = this.patientForm.get('birthMonth')?.value || ''
    const year = this.patientForm.get('birthYear')?.value || ''
    const clamped = this.clampDayToMonth(current, month, year)
    if (clamped !== current) {
      dayCtrl.setValue(clamped, { emitEvent: false })
    }
  }

  public getDisplayAge(): string {
    const mode = this.patientForm?.get('birthMode')?.value
    if (mode === 'exact') {
      const day = this.patientForm.get('birthDay')?.value
      const month = this.patientForm.get('birthMonth')?.value
      const year = this.patientForm.get('birthYear')?.value
      const age = this.computeAgeFromParts(year, month, day)
      return age === null ? '' : `${age}`
    }

    if (mode === 'yearOnly') {
      const year = this.patientForm.get('birthYearOnly')?.value
      const age = this.computeAgeFromYear(year)
      return age === null ? '' : `≈ ${age}`
    }

    return ''
  }

  private computeAgeFromParts(
    year: string | number | null | undefined,
    month: string | number | null | undefined,
    day: string | number | null | undefined
  ): number | null {
    const y = Number(year)
    const m = Number(month)
    const d = Number(day)
    if (!y || !m || !d) return null

    const birthDate = this.buildUtcDate(y, m, d)
    if (!birthDate) return null

    const today = new Date()
    const todayUtc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    )
    let age = todayUtc.getUTCFullYear() - birthDate.getUTCFullYear()
    const monthDiff = todayUtc.getUTCMonth() - birthDate.getUTCMonth()
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && todayUtc.getUTCDate() < birthDate.getUTCDate())
    ) {
      age--
    }

    if (age < 0 || age > 120) return null
    return age
  }

  private computeAgeFromYear(
    year: string | number | null | undefined
  ): number | null {
    const y = Number(year)
    if (!y) return null
    const age = new Date().getFullYear() - y
    if (age < 0 || age > 120) return null
    return age
  }

  private resetPhotoState(): void {
    this.selectedPhotoFile = null
    this.photoPreviewUrl = null
    this.uploadedPhotoFileId = null
    this.photoMarkedForDeletion = false

    if (this.photoInput?.nativeElement) {
      this.photoInput.nativeElement.value = ''
    }
  }

  public onSubmit(): void {
    if (this.patientForm.invalid) {
      this.markFormGroupTouched()
      return
    }

    this.loading = true
    const formData = this.prepareFormData()

    if (this.isEditMode && this.selectedPatient) {
      this.updatePatient(formData)
    } else {
      this.createPatient(formData)
    }
  }

  private prepareFormData(): any {
    const formValue = { ...this.patientForm.value }
    const builtEmail = this.buildEmailFromForm(formValue)
    const birthPayload = this.buildBirthPayload(formValue)

    if (!this.isEditMode) {
      delete formValue.isActive
    }

    delete formValue.emailLocalPart
    delete formValue.emailDomain
    delete formValue.emailCustomDomain
    delete formValue.birthMode
    delete formValue.birthDay
    delete formValue.birthMonth
    delete formValue.birthYear
    delete formValue.birthYearOnly

    formValue.email = builtEmail
    formValue.dateOfBirth = birthPayload.dateOfBirth
    formValue.birthYear = birthPayload.birthYear

    Object.keys(formValue).forEach((key) => {
      if (formValue[key] === '' || formValue[key] === undefined) {
        delete formValue[key]
      }
    })

    if (this.isEditMode) {
      if (birthPayload.dateOfBirth === null) {
        formValue.dateOfBirth = null
      }
      if (birthPayload.birthYear === null) {
        formValue.birthYear = null
      }
    }

    return formValue
  }

  private buildBirthPayload(formValue: any): {
    dateOfBirth: string | null | undefined
    birthYear: number | null | undefined
  } {
    const mode = formValue.birthMode
    if (mode === 'exact') {
      const rawMonth = Number(formValue.birthMonth)
      const rawYear = Number(formValue.birthYear)
      const rawDay = Number(formValue.birthDay)
      if (rawDay && rawMonth && rawYear) {
        const maxDay = this.getMaxDaysInMonth(
          formValue.birthMonth,
          formValue.birthYear
        )
        const safeDay = Math.min(rawDay, maxDay)
        const date = this.buildUtcDate(rawYear, rawMonth, safeDay)
        if (date) {
          return { dateOfBirth: date.toISOString(), birthYear: null }
        }
      }
      return this.isEditMode
        ? { dateOfBirth: null, birthYear: null }
        : { dateOfBirth: undefined, birthYear: undefined }
    }

    if (mode === 'yearOnly') {
      const year = Number(formValue.birthYearOnly)
      if (year) {
        return { dateOfBirth: null, birthYear: year }
      }
      return this.isEditMode
        ? { dateOfBirth: null, birthYear: null }
        : { dateOfBirth: undefined, birthYear: undefined }
    }

    return { dateOfBirth: undefined, birthYear: undefined }
  }

  private createPatient(patientData: any): void {
    this._patientService
      .createPatient(patientData)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: async (response) => {
          const createdPatient = response.data

          if (this.selectedPhotoFile && createdPatient?.id) {
            await this.uploadPhoto(createdPatient.id)
          }

          this.loading = false

          if (createdPatient) {
            this.patientCreated.emit(createdPatient)
          }

          if (this.openClientAfterCreate && createdPatient?.id) {
            this.openClientAfterCreate = false
            this.selectedPatient = createdPatient
            this.isEditMode = true
            this.buttonAction = BUTTON_ACTIONS.EDIT
            this.setModalTitle()
            this.initializeForm()
            this.populateForm()
            this.loadClients()
            this.openCreateClientModal()
            return
          }

          if (createdPatient?.id) {
            await this.handlePostCreateFlow(createdPatient)
          }

          this._activeModal.close('created')
        },
        error: (error) => {
          console.error('PatientFormModal - Create patient ERROR:', error)
          this.openClientAfterCreate = false
          this.loading = false
        },
      })
  }

  private updatePatient(patientData: any): void {
    if (!this.selectedPatient?.id) return

    // Si se marcó la foto para eliminación, agregar profilePhoto: null
    if (this.photoMarkedForDeletion) {
      patientData.profilePhoto = null
    }

    this._patientService
      .updatePatient(this.selectedPatient.id, patientData)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: async (response) => {
          // Solo subir nueva foto si hay una seleccionada y NO está marcada para eliminación
          if (
            this.selectedPhotoFile &&
            !this.photoMarkedForDeletion &&
            this.selectedPatient?.id
          ) {
            await this.uploadPhoto(this.selectedPatient.id)
          }
          this.loading = false
          this.patientUpdated.emit(response.data)
          this._activeModal.close('updated')
        },
        error: (error) => {
          console.error('PatientFormModal - Update patient ERROR:', error)
          this.loading = false
        },
      })
  }

  private markFormGroupTouched(): void {
    Object.keys(this.patientForm.controls).forEach((key) => {
      const control = this.patientForm.get(key)
      control?.markAsTouched()
    })
  }

  public isFieldInvalid(fieldName: string): boolean {
    const field = this.patientForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  public getFieldError(fieldName: string): string | null {
    const field = this.patientForm.get(fieldName)
    if (!field || field.valid) return null

    if (field.hasError('required')) return 'VALIDATION.REQUIRED'
    if (field.hasError('email')) return 'VALIDATION.EMAIL_INVALID'
    if (field.hasError('minlength')) return 'VALIDATION.MIN_LENGTH'
    if (field.hasError('pattern')) return 'VALIDATION.PHONE_INVALID'

    return null
  }

  public onCancel(): void {
    if (this.hasClientChanges) {
      this._activeModal.close('updated')
      return
    }

    this._activeModal.dismiss('cancel')
  }

  public createAndAddClient(): void {
    if (this.patientForm.invalid) {
      this.markFormGroupTouched()
      return
    }

    this.openClientAfterCreate = true
    this.onSubmit()
  }

  public openCreateClientModal(): void {
    if (!this.selectedPatient?.id) {
      this._notificationService.showNotification({
        type: 'error',
        message: 'ERROR.PATIENT_NOT_SELECTED',
      })
      return
    }

    const modalRef = this._modalService.open(ClientModalComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    })

    modalRef.componentInstance.mode = 'create'
    modalRef.componentInstance.patientId = this.selectedPatient.id

    modalRef.result.then(
      (createdClient?: Client) => {
        if (createdClient?.id) {
          this.hasClientChanges = true
          this.clients = [
            createdClient,
            ...this.clients.filter((client) => client.id !== createdClient.id),
          ]
          this.loadClients(createdClient)
          return
        }
        this.loadClients()
      },
      () => {}
    )
  }

  public openEditClientModal(client: Client): void {
    if (!this.selectedPatient?.id || !client?.id) {
      return
    }

    const modalRef = this._modalService.open(ClientModalComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    })

    modalRef.componentInstance.mode = 'edit'
    modalRef.componentInstance.patientId = this.selectedPatient.id
    modalRef.componentInstance.client = client

    modalRef.result.then(
      (updatedClient?: Client) => {
        if (updatedClient?.id) {
          this.hasClientChanges = true
          this.clients = this.mergeClients(updatedClient, this.clients)
          this.loadClients(updatedClient)
          return
        }
        this.loadClients()
      },
      () => {}
    )
  }

  private loadClients(recentlyCreatedClient?: Client): void {
    if (!this.selectedPatient?.id) {
      this.clients = []
      return
    }

    this.clientsLoading = true
    this._clientsService
      .getAll(this.selectedPatient.id, { page: 1, limit: 50 })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (result) => {
          const fetchedClients = result.data || []
          this.clients = recentlyCreatedClient?.id
            ? this.mergeClients(recentlyCreatedClient, fetchedClients)
            : fetchedClients
          this.clientsLoading = false
        },
        error: () => {
          this.clients = []
          this.clientsLoading = false
        },
      })
  }

  private mergeClients(createdClient: Client, fetchedClients: Client[]): Client[] {
    return [
      createdClient,
      ...fetchedClients.filter((client) => client.id !== createdClient.id),
    ]
  }

  public triggerPhotoInput(): void {
    this.photoInput.nativeElement.click()
  }

  public onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) {
      return
    }

    const file = input.files[0]

    if (!file.type.startsWith('image/')) {
      console.error('El archivo seleccionado no es una imagen')
      return
    }

    const maxSize = 8 * 1024 * 1024
    if (file.size > maxSize) {
      console.error('La imagen es demasiado grande (máximo 8MB)')
      return
    }

    this.selectedPhotoFile = file
    this.photoMarkedForDeletion = false

    const reader = new FileReader()
    reader.onload = (e: any) => {
      this.photoPreviewUrl = e.target.result
    }
    reader.readAsDataURL(file)
  }

  public removePhoto(): void {
    this.selectedPhotoFile = null
    this.photoPreviewUrl = null
    this.uploadedPhotoFileId = null
    this.photoMarkedForDeletion = true
    if (this.photoInput) {
      this.photoInput.nativeElement.value = ''
    }
  }

  private async uploadPhoto(patientId: string): Promise<string | null> {
    if (!this.selectedPhotoFile) {
      return null
    }

    const formData = new FormData()
    formData.append('file', this.selectedPhotoFile)

    try {
      const response: any = await firstValueFrom(
        this._http.post(
          `${environment.apiBaseUrl}/patients/${patientId}/profile-photo`,
          formData
        )
      )
      return response.data?.profilePhoto || null
    } catch (error) {
      console.error('Error al subir la imagen:', error)
      return null
    }
  }

  private formatUrl(url?: string): string {
    if (!url) {
      return 'assets/images/default-avatar.png'
    }

    const cleanUrl = url.replace('/uploads/uploads/', '/uploads/')

    if (cleanUrl.startsWith('/')) {
      return (
        this.fileBaseUrl + cleanUrl.replace(/ /g, '%20').replace(/\\/g, '/')
      )
    }

    return (
      this.fileBaseUrl + '/' + cleanUrl.replace(/ /g, '%20').replace(/\\/g, '/')
    )
  }

  private parseDateInputValue(
    value: string | Date | null | undefined
  ): Date | null {
    if (!value) return null

    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value
    }

    const trimmedValue = value.trim()
    if (!trimmedValue) return null

    const maskedMatch = trimmedValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (maskedMatch) {
      const day = Number.parseInt(maskedMatch[1], 10)
      const month = Number.parseInt(maskedMatch[2], 10)
      const year = Number.parseInt(maskedMatch[3], 10)
      return this.buildUtcDate(year, month, day)
    }

    const isoMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (isoMatch) {
      const year = Number.parseInt(isoMatch[1], 10)
      const month = Number.parseInt(isoMatch[2], 10)
      const day = Number.parseInt(isoMatch[3], 10)
      return this.buildUtcDate(year, month, day)
    }

    const parsedDate = new Date(trimmedValue)
    return isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  private buildUtcDate(
    year: number,
    month: number,
    day: number
  ): Date | null {
    if (!year || !month || !day) {
      return null
    }

    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null
    }

    return date
  }

  private generateBirthYearOptions(): void {
    const currentYear = new Date().getFullYear()
    const totalYears = 121

    this.birthYearOptions = Array.from(
      { length: totalYears },
      (_, index) => String(currentYear - index)
    )
  }

  public isManualEmailDomain(): boolean {
    return this.patientForm.get('emailDomain')?.value === this.manualEmailDomainValue
  }

  public onEmailDomainChange(): void {
    if (!this.isManualEmailDomain()) {
      this.patientForm.get('emailCustomDomain')?.setValue('')
    }
  }

  private buildEmailFromForm(formValue: any): string | undefined {
    const localPart = (formValue.emailLocalPart || '').trim()
    if (!localPart) {
      return undefined
    }

    const selectedDomain = (formValue.emailDomain || '').trim()
    if (!selectedDomain) {
      return undefined
    }

    if (selectedDomain === this.manualEmailDomainValue) {
      const customDomain = (formValue.emailCustomDomain || '').trim()
      if (!customDomain) {
        return undefined
      }
      const normalizedDomain = customDomain.startsWith('@')
        ? customDomain.toLowerCase()
        : `@${customDomain.toLowerCase()}`
      return `${localPart.toLowerCase()}${normalizedDomain}`
    }

    return `${localPart.toLowerCase()}${selectedDomain.toLowerCase()}`
  }

  private parseEmailForForm(email?: string): {
    localPart: string
    domain: string
    customDomain: string
  } {
    if (!email || !email.includes('@')) {
      return {
        localPart: '',
        domain: '@gmail.com',
        customDomain: '',
      }
    }

    const [localPart, ...domainParts] = email.split('@')
    const domain = `@${domainParts.join('@').toLowerCase()}`
    const knownDomain = this.commonEmailDomains.find((item) => item === domain)

    if (knownDomain) {
      return {
        localPart,
        domain: knownDomain,
        customDomain: '',
      }
    }

    return {
      localPart,
      domain: this.manualEmailDomainValue,
      customDomain: domain,
    }
  }

  private async handlePostCreateFlow(patient: Patient): Promise<void> {
    const result = await Swal.fire({
      title: 'Paciente creado',
      text: '¿Qué deseas hacer ahora?',
      icon: 'success',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Crear historial clínico',
      denyButtonText: 'Crear cita',
      cancelButtonText: 'Cerrar',
      reverseButtons: true,
    })

    if (result.isConfirmed && patient.id) {
      this.openCreateMedicalHistoryModal(patient.id)
      return
    }

    if (result.isDenied && patient.id) {
      this.openCreateShiftModal(patient.id)
    }
  }

  private openCreateMedicalHistoryModal(patientId: string): void {
    const modalRef = this._modalService.open(ClinicalHistoryUpsertModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    })

    modalRef.componentInstance.editMode = false
    modalRef.componentInstance.preSelectedPatientId = patientId
  }

  private openCreateShiftModal(patientId: string): void {
    const modalRef = this._modalService.open(ShiftModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    })

    modalRef.componentInstance.editMode = false
    modalRef.componentInstance.selectedShift = null
    modalRef.componentInstance.preSelectedPatientId = patientId
  }
}
