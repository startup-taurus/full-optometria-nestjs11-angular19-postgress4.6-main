import { CommonModule } from '@angular/common'
import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { HttpClient } from '@angular/common/http'
import { environment } from '@environment/environment'
import { BUTTON_ACTIONS } from '@core/helpers/ui/constants'
import { Patient } from '@core/interfaces/api/patient.interface'
import { ButtonAction } from '@core/interfaces/ui/ui.interface'
import { ModalWithAction } from '@core/interfaces/ui/bootstrap-modal.interface'
import { PatientService } from '@core/services/api/patient.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { Subject, takeUntil, firstValueFrom } from 'rxjs'

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

  public selectedPhotoFile: File | null = null
  public photoPreviewUrl: string | null = null
  public uploadedPhotoFileId: string | null = null
  public photoMarkedForDeletion = false

  private unsubscribe$ = new Subject<void>()

  private _formBuilder = inject(FormBuilder)
  private _patientService = inject(PatientService)
  private _activeModal = inject(NgbActiveModal)
  private _bsModalService = inject(
    BootstrapModalService<ModalWithAction<Patient>>
  )
  private _http = inject(HttpClient)

  ngOnInit(): void {
    this.initializeForm()
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
  }

  public setModalData(data: ModalWithAction<Patient>): void {
    this.buttonAction = data.buttonAction
    this.selectedPatient = data.selectedRow
    this.isEditMode = this.buttonAction === BUTTON_ACTIONS.EDIT

    this.initializeForm()

    if (this.isEditMode && data.selectedRow) {
      this.populateForm()
      this.loading = false
    } else {
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
      email: ['', [Validators.required, Validators.email]],
      documentNumber: ['', [Validators.required, Validators.minLength(1)]],
      dateOfBirth: ['', [Validators.required]],
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
      let dateOfBirthForInput = ''
      if (this.selectedPatient.dateOfBirth) {
        try {
          const date = new Date(this.selectedPatient.dateOfBirth)
          if (!isNaN(date.getTime())) {
            dateOfBirthForInput = date.toISOString().split('T')[0]
          }
        } catch (error) {}
      }

      // Cargar foto de perfil si existe
      if (this.selectedPatient.profilePhoto) {
        this.photoPreviewUrl = `${environment.apiBaseUrl}${this.selectedPatient.profilePhoto}`
        this.uploadedPhotoFileId = this.selectedPatient.profilePhoto
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
          let isoString: string

          if (/^\d{4}-\d{2}-\d{2}$/.test(formValue.dateOfBirth)) {
            const [year, month, day] = formValue.dateOfBirth
              .split('-')
              .map((n: string) => parseInt(n, 10))
            const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

            if (!isNaN(date.getTime())) {
              isoString = date.toISOString()
              formValue.dateOfBirth = isoString
            }
          } else {
            const date = new Date(formValue.dateOfBirth)
            if (!isNaN(date.getTime())) {
              isoString = date.toISOString()
              formValue.dateOfBirth = isoString
            }
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
          if (this.selectedPhotoFile && response.data?.id) {
            await this.uploadPhoto(response.data.id)
          }
          this.loading = false
          this.patientCreated.emit(response.data)
          this._activeModal.close('created')
        },
        error: (error) => {
          console.error('PatientFormModal - Create patient ERROR:', error)
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
    this._activeModal.dismiss('cancel')
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
}
