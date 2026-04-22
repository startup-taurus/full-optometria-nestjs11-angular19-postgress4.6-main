import { CommonModule } from '@angular/common'
import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core'
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
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
import { NgxMaskDirective } from 'ngx-mask'

@Component({
  selector: 'app-patient-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgxMaskDirective],
  templateUrl: './patient-form-modal.component.html',
  styleUrls: ['./patient-form-modal.component.scss'],
})
export class PatientFormModalComponent implements OnInit, OnDestroy {
  @ViewChild('photoInput') photoInput!: ElementRef
  @ViewChild('nativeDatePicker') nativeDatePicker?: ElementRef<HTMLInputElement>
  @Output() patientCreated = new EventEmitter<Patient>()
  @Output() patientUpdated = new EventEmitter<Patient>()

  public patientForm!: FormGroup
  public buttonAction: ButtonAction = BUTTON_ACTIONS.ADD
  public selectedPatient?: Patient
  public loading = false
  public isEditMode = false
  public modalTitle = ''

  public selectedPhotoFile: File | null = null
  public photoPreviewUrl: string | null = null
  public uploadedPhotoFileId: string | null = null
  public photoMarkedForDeletion = false
  public clients: Client[] = []
  public clientsLoading = false
  public useMobileDateDropdown = false
  public mobileBirthDay = ''
  public mobileBirthMonth = ''
  public mobileBirthYear = ''
  public readonly mobileBirthDays = Array.from({ length: 31 }, (_, index) =>
    String(index + 1).padStart(2, '0')
  )
  public readonly mobileBirthMonths = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, '0')
  )
  public mobileBirthYears: string[] = []
  private fileBaseUrl: string = environment.fileBaseUrl

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
    this.updateDateInputMode()
    this.setModalTitle()

    this._bsModalService
      .getDataIssued()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: ModalWithAction<Patient>) => {
        this.setModalData(data)
      })
  }

    @HostListener('window:resize')
    onWindowResize(): void {
      this.updateDateInputMode()
    }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
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

    this.syncMobileDatePartsFromControl()

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
      email: ['', [Validators.required, Validators.email]],
      documentNumber: ['', [Validators.required, Validators.minLength(1)]],
      dateOfBirth: ['', [Validators.required, this.dateOfBirthValidator]],
      mobilePhone: ['', [Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      homePhone: [''],
      address: [''],
    }

    if (this.isEditMode) {
      baseFormConfig.isActive = [true]
    }

    this.patientForm = this._formBuilder.group(baseFormConfig)
    this.clearMobileDateParts()
  }

  private populateForm(): void {
    if (this.selectedPatient) {
      const dateOfBirthForInput = this.formatDateForInput(
        this.selectedPatient.dateOfBirth
      )

      // Cargar foto de perfil si existe
      if (this.selectedPatient.profilePhoto) {
        this.photoPreviewUrl = this.formatUrl(this.selectedPatient.profilePhoto)
        this.uploadedPhotoFileId = this.selectedPatient.profilePhoto
      } else {
        this.photoPreviewUrl = null
        this.uploadedPhotoFileId = null
      }

      const formData = {
        firstName: this.selectedPatient.firstName,
        lastName: this.selectedPatient.lastName,
        email: this.selectedPatient.email || '',
        documentNumber: this.selectedPatient.documentNumber || '',
        dateOfBirth: dateOfBirthForInput,
        address: this.selectedPatient.address || '',
        homePhone: this.selectedPatient.homePhone || '',
        mobilePhone: this.selectedPatient.mobilePhone || '',
        isActive: this.selectedPatient.isActive ?? true,
      }

      this.patientForm.patchValue(formData)
      this.syncMobileDatePartsFromControl()
    }
  }

  public openDesktopDatePicker(event?: Event): void {
    event?.preventDefault()

    if (this.useMobileDateDropdown) {
      return
    }

    const picker = this.nativeDatePicker?.nativeElement
    if (!picker) {
      return
    }

    const currentValue = this.patientForm.get('dateOfBirth')?.value
    const parsedCurrentDate = this.parseDateInputValue(currentValue)
    picker.value = parsedCurrentDate ? this.toIsoDate(parsedCurrentDate) : ''

    if (typeof picker.showPicker === 'function') {
      picker.showPicker()
      return
    }

    picker.focus()
    picker.click()
  }

  public onNativeDateSelected(value: string): void {
    if (!value) {
      return
    }

    const parsedDate = this.parseDateInputValue(value)
    if (!parsedDate) {
      return
    }

    const control = this.patientForm.get('dateOfBirth')
    if (!control) {
      return
    }

    control.setValue(this.formatDateForInput(parsedDate))
    control.markAsDirty()
    control.markAsTouched()
    this.syncMobileDatePartsFromDate(parsedDate)
  }

  public onMobileDatePartChange(
    part: 'day' | 'month' | 'year',
    value: string
  ): void {
    if (part === 'day') this.mobileBirthDay = value
    if (part === 'month') this.mobileBirthMonth = value
    if (part === 'year') this.mobileBirthYear = value

    this.updateDateOfBirthFromMobileParts()
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

    // Remover isActive en creación (solo permitirlo en edición)
    if (!this.isEditMode) {
      delete formValue.isActive
    }

    if (formValue.dateOfBirth) {
      if (
        typeof formValue.dateOfBirth === 'string' &&
        formValue.dateOfBirth.trim() !== ''
      ) {
        try {
          const parsedDate = this.parseDateInputValue(formValue.dateOfBirth)

          if (parsedDate) {
            formValue.dateOfBirth = parsedDate.toISOString()
          } else {
            delete formValue.dateOfBirth
          }
        } catch (error) {}
      } else if (
        formValue.dateOfBirth === '' ||
        formValue.dateOfBirth === null ||
        formValue.dateOfBirth === undefined
      ) {
        delete formValue.dateOfBirth
      }
    }

    // Limpiar campos vacíos
    Object.keys(formValue).forEach((key) => {
      if (
        formValue[key] === '' ||
        formValue[key] === null ||
        formValue[key] === undefined
      ) {
        delete formValue[key]
      }
    })

    return formValue
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
    if (
      fieldName === 'dateOfBirth' &&
      (field.hasError('invalidDate') || field.hasError('pattern'))
    ) {
      return 'PATIENT.FORM.DATE_OF_BIRTH_INVALID'
    }
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

  private dateOfBirthValidator = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const value = control.value

    if (value === null || value === undefined || value === '') {
      return null
    }

    if (typeof value !== 'string') {
      return { invalidDate: true }
    }

    return this.parseDateInputValue(value) ? null : { invalidDate: true }
  }

  private formatDateForInput(dateValue?: string | Date | null): string {
    const parsedDate = this.parseDateInputValue(dateValue)
    if (!parsedDate) return ''

    const day = String(parsedDate.getUTCDate()).padStart(2, '0')
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0')
    const year = parsedDate.getUTCFullYear()

    return `${day}/${month}/${year}`
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

  private updateDateInputMode(): void {
    this.useMobileDateDropdown = window.innerWidth < 768

    if (this.useMobileDateDropdown) {
      this.syncMobileDatePartsFromControl()
    }
  }

  private updateDateOfBirthFromMobileParts(): void {
    const control = this.patientForm.get('dateOfBirth')
    if (!control) {
      return
    }

    if (!this.mobileBirthDay || !this.mobileBirthMonth || !this.mobileBirthYear) {
      control.setValue('')
      return
    }

    const combinedValue = `${this.mobileBirthDay}/${this.mobileBirthMonth}/${this.mobileBirthYear}`
    control.setValue(combinedValue)
    control.markAsDirty()
    control.markAsTouched()
  }

  private syncMobileDatePartsFromControl(): void {
    const controlValue = this.patientForm.get('dateOfBirth')?.value
    const parsedDate = this.parseDateInputValue(controlValue)
    this.syncMobileDatePartsFromDate(parsedDate)
  }

  private syncMobileDatePartsFromDate(date: Date | null): void {
    if (!date) {
      this.clearMobileDateParts()
      return
    }

    this.mobileBirthDay = String(date.getUTCDate()).padStart(2, '0')
    this.mobileBirthMonth = String(date.getUTCMonth() + 1).padStart(2, '0')
    this.mobileBirthYear = String(date.getUTCFullYear())
  }

  private clearMobileDateParts(): void {
    this.mobileBirthDay = ''
    this.mobileBirthMonth = ''
    this.mobileBirthYear = ''
  }

  private generateBirthYearOptions(): void {
    const currentYear = new Date().getFullYear()
    const totalYears = 121

    this.mobileBirthYears = Array.from(
      { length: totalYears },
      (_, index) => String(currentYear - index)
    )
  }

  private toIsoDate(date: Date): string {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}
