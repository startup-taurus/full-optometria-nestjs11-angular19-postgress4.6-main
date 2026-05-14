import { Component, Input, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ValidationErrors,
  AbstractControl,
} from '@angular/forms'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { NgSelectModule } from '@ng-select/ng-select'

import { ClientsService } from '@core/services/api/clients.service'
import { PatientService } from '@core/services/api/patient.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { Client, CreateClientDto } from '@core/interfaces/api/client.interface'
import { Patient } from '@core/interfaces/api/patient.interface'

export type ClientModalMode = 'create' | 'edit'

@Component({
  selector: 'app-client-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule],
  templateUrl: './client-modal.component.html',
  styleUrls: ['./client-modal.component.scss'],
})
export class ClientModalComponent implements OnInit {
  @Input() mode: ClientModalMode = 'create'
  @Input() patientId?: string | null
  @Input() client?: Client
  @Input() allowPatientSelection = false

  private _fb = inject(FormBuilder)
  private _clientsService = inject(ClientsService)
  private _patientService = inject(PatientService)
  private _notificationService = inject(ToastrNotificationService)
  public activeModal = inject(NgbActiveModal)

  public clientForm!: FormGroup
  public isLoading = false
  public searchingPatients = false
  public patientOptions: Array<
    Pick<Patient, 'id' | 'firstName' | 'lastName' | 'documentNumber'>
  > = []

  ngOnInit(): void {
    this.initializeForm()
  }

  private atLeastOnePhoneValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const mobilePhone = String(control.get('mobilePhone')?.value || '').trim()
    const homePhone = String(control.get('homePhone')?.value || '').trim()

    if (!mobilePhone && !homePhone) {
      return { atLeastOnePhone: true }
    }

    return null
  }

  get isCreateMode(): boolean {
    return this.mode === 'create'
  }

  private initializeForm(): void {
    const initialPatientIds = this.resolveInitialPatientIds()

    this.clientForm = this._fb.group(
      {
        patientIds: [initialPatientIds],
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        documentNumber: ['', Validators.required],
        mobilePhone: [''],
        homePhone: [''],
        address: ['', [Validators.required]],
      },
      {
        validators: this.atLeastOnePhoneValidator,
      }
    )

    if (this.mode === 'edit' && this.client) {
      this.clientForm.patchValue(this.client)
      this.clientForm.patchValue({ patientIds: initialPatientIds })
    }

    if (!this.allowPatientSelection) {
      this.clientForm
        .get('patientIds')
        ?.setValue(this.patientId ? [this.patientId] : [])
    }

    if (this.allowPatientSelection) {
      this.loadAllPatients()
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.clientForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  isPhoneGroupInvalid(): boolean {
    const mobileTouched = this.clientForm.get('mobilePhone')?.touched || false
    const homeTouched = this.clientForm.get('homePhone')?.touched || false
    return (
      this.clientForm.hasError('atLeastOnePhone') &&
      (mobileTouched || homeTouched || this.clientForm.dirty)
    )
  }

  save(): void {
    if (!this.clientForm.valid || this.isLoading) {
      return
    }

    if (!this.allowPatientSelection && !this.patientId) {
      this._notificationService.showNotification({
        type: 'error',
        message: 'ERROR.PATIENT_NOT_SELECTED',
      })
      return
    }

    this.isLoading = true
    const formValue = this.clientForm.value as CreateClientDto
    const normalizedPatientIds = this.normalizePatientIds(formValue.patientIds)

    const payload: CreateClientDto = {
      ...formValue,
      patientIds: this.allowPatientSelection
        ? normalizedPatientIds
        : this.patientId
          ? [this.patientId]
          : [],
      patientId: this.allowPatientSelection
        ? normalizedPatientIds[0] || null
        : this.patientId || null,
    }

    const saveOperation = this.allowPatientSelection
      ? this.mode === 'create'
        ? this._clientsService.createGlobal(payload)
        : this._clientsService.updateGlobal(this.client!.id, payload)
      : this.mode === 'create'
        ? this._clientsService.create(this.patientId!, payload)
        : this._clientsService.update(this.patientId!, this.client!.id, payload)

    saveOperation.subscribe({
      next: (result) => {
        const successKey =
          this.mode === 'create' ? 'CLIENT.CREATED' : 'CLIENT.UPDATED'
        this._notificationService.showNotification({
          type: 'success',
          message: successKey,
        })
        this.activeModal.close(result)
      },
      error: (error) => {
        const errorMsg = error?.error?.message?.es || error?.message || 'Error'
        this._notificationService.showNotification({
          type: 'error',
          message: errorMsg,
        })
        this.isLoading = false
      },
    })
  }

  public onPatientSearch(term: string): void {
    if (!this.allowPatientSelection) {
      return
    }

    const normalized = term?.trim()
    if (!normalized || normalized.length < 2) {
      this.loadAllPatients()
      return
    }

    this.searchingPatients = true
    this._patientService.searchPatients(normalized).subscribe({
      next: (response) => {
        this.patientOptions = (response.data || []).map((patient) => ({
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          documentNumber: patient.documentNumber,
        }))
        this.searchingPatients = false
      },
      error: () => {
        this.patientOptions = []
        this.searchingPatients = false
      },
    })
  }

  private resolveInitialPatientIds(): string[] {
    if (
      Array.isArray(this.client?.patientIds) &&
      this.client?.patientIds?.length
    ) {
      return this.normalizePatientIds(this.client.patientIds)
    }

    if (Array.isArray(this.client?.patients) && this.client?.patients?.length) {
      return this.normalizePatientIds(
        this.client.patients.map((item) => item.id)
      )
    }

    if (this.client?.patientId) {
      return [this.client.patientId]
    }

    if (this.patientId) {
      return [this.patientId]
    }

    return []
  }

  private normalizePatientIds(patientIds?: string[] | null): string[] {
    return Array.from(
      new Set(
        (patientIds || [])
          .map((id) => String(id || '').trim())
          .filter((id) => id.length > 0)
      )
    )
  }

  private loadAllPatients(): void {
    this.searchingPatients = true
    this._patientService.getPatientsByBranch(undefined).subscribe({
      next: (patients) => {
        this.patientOptions = (patients || []).map((patient) => ({
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          documentNumber: patient.documentNumber,
        }))
        this.searchingPatients = false
      },
      error: () => {
        this.patientOptions = []
        this.searchingPatients = false
      },
    })
  }

  public getPatientLabel(
    patient: Pick<Patient, 'id' | 'firstName' | 'lastName' | 'documentNumber'>
  ): string {
    return `${patient.firstName} ${patient.lastName} - ${patient.documentNumber}`
  }
}
