import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormGroup } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgSelectModule } from '@ng-select/ng-select'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

import { ClientsService } from '@core/services/api/clients.service'
import { Client, CreateClientDto } from '@core/interfaces/api/client.interface'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { ClientModalComponent } from '../../modals/client-modal/client-modal.component'

interface ClientOption extends Client {
  isPatientSelf?: boolean
  displayLabel: string
}

@Component({
  selector: 'app-laboratory-order-step1',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule],
  templateUrl: './laboratory-order-step1.component.html',
  styleUrls: ['./laboratory-order-step1.component.scss'],
})
export class LaboratoryOrderStep1Component
  implements OnInit, OnDestroy, OnChanges
{
  @Input() formGroup!: FormGroup
  @Input() preloadedData: any = null

  private _clientsService = inject(ClientsService)
  private _modalService = inject(NgbModal)
  private _notificationService = inject(ToastrNotificationService)
  private _translateService = inject(TranslateService)
  private destroy$ = new Subject<void>()

  public clients: ClientOption[] = []
  public clientsLoading = false
  public selectedClient: ClientOption | null = null
  private readonly selfClientOptionId = '__patient_as_client__'
  private clientControlSyncInitialized = false
  private readonly loadingClientIds = new Set<string>()

  ngOnInit(): void {
    this.initializeClientControlSync()
    this.loadPrefilledData()
    this.loadClientList()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formGroup']) {
      this.clientControlSyncInitialized = false
      this.initializeClientControlSync()
      this.syncSelectedClientWithControlValue()
    }

    if (changes['preloadedData']) {
      this.loadPrefilledData()
      this.loadClientList()
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private loadPrefilledData(): void {
    if (!this.preloadedData || !this.formGroup) {
      return
    }

    this.syncSelectedClientWithControlValue()
  }

  private loadClientList(): void {
    if (!this.preloadedData?.patientId) return

    this.clientsLoading = true
    this._clientsService
      .getAll(this.preloadedData.patientId, { page: 1, limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const selectedId = this.extractClientId(this.formGroup.get('clientId')?.value)
          const fetchedClients = (result.data || []) as Client[]

          if (
            selectedId &&
            selectedId !== this.selfClientOptionId &&
            !fetchedClients.some((client) => client.id === selectedId)
          ) {
            this.ensureSelectedClientInFetchedList(selectedId, fetchedClients)
            return
          }

          this.clients = this.buildClientOptions(fetchedClients)
          this.clientsLoading = false
          this.syncSelectedClientWithControlValue()
        },
        error: (error) => {
          this.clients = this.buildClientOptions([])
          this.clientsLoading = false
          this.syncSelectedClientWithControlValue()
          console.error('Error loading clients:', error)
        },
      })
  }

  private ensureSelectedClientInFetchedList(
    selectedId: string,
    fetchedClients: Client[]
  ): void {
    if (!this.preloadedData?.patientId) {
      this.clients = this.buildClientOptions(fetchedClients)
      this.clientsLoading = false
      this.syncSelectedClientWithControlValue()
      return
    }

    this._clientsService
      .getById(this.preloadedData.patientId, selectedId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (missingClient) => {
          const sourceClients = missingClient
            ? [missingClient, ...fetchedClients.filter((client) => client.id !== missingClient.id)]
            : fetchedClients

          this.clients = this.buildClientOptions(sourceClients)
          this.clientsLoading = false
          this.syncSelectedClientWithControlValue()
        },
        error: () => {
          this.clients = this.buildClientOptions(fetchedClients)
          this.clientsLoading = false
          this.syncSelectedClientWithControlValue()
        },
      })
  }

  private buildClientOptions(clients: Client[]): ClientOption[] {
    const options: ClientOption[] = [...clients].map((client): ClientOption => {
      const isPatientSelf =
        Boolean((client as ClientOption).isPatientSelf) ||
        this.isEquivalentToPatientByDocument(client.documentNumber)

      return {
        ...client,
        isPatientSelf,
        displayLabel: this.buildClientLabel({
          firstName: client.firstName,
          lastName: client.lastName,
          documentNumber: client.documentNumber,
          isPatientSelf,
        }),
      }
    })

    const patientOption = this.buildPatientAsClientOption()
    const hasEquivalentClient = options.some((client) =>
      this.isEquivalentToPatientByDocument(client.documentNumber)
    )

    if (patientOption && !hasEquivalentClient) {
      options.unshift(patientOption)
    }

    return options
  }

  private isEquivalentToPatientByDocument(documentNumber?: string): boolean {
    if (!this.preloadedData?.documentNumber) {
      return false
    }

    const patientDocument = String(this.preloadedData.documentNumber || '').trim()
    const clientDocument = String(documentNumber || '').trim()

    return !!patientDocument && !!clientDocument && patientDocument === clientDocument
  }

  private buildClientLabel(client: Pick<ClientOption, 'firstName' | 'lastName' | 'documentNumber' | 'isPatientSelf'>): string {
    const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim()
    const document = String(client.documentNumber || '').trim()
    const suffix = client.isPatientSelf
      ? ` (${this._translateService.instant('CLIENT.IS_PATIENT')})`
      : ''

    if (!fullName && !document) {
      return `${this._translateService.instant('CLIENT.UNIDENTIFIED')}${suffix}`.trim()
    }

    if (fullName && document) {
      return `${fullName}${suffix} - ${document}`.trim()
    }

    if (fullName) {
      return `${fullName}${suffix}`.trim()
    }

    return `${document}${suffix}`.trim()
  }

  private buildPatientAsClientOption(): ClientOption | null {
    if (!this.preloadedData?.patientId) {
      return null
    }

    return {
      id: this.selfClientOptionId,
      patientId: this.preloadedData.patientId,
      firstName: this.preloadedData.firstName || '',
      lastName: this.preloadedData.lastName || '',
      documentNumber: this.preloadedData.documentNumber || '',
      email: this.preloadedData.email || '',
      mobilePhone: this.preloadedData.mobilePhone || '',
      homePhone: this.preloadedData.homePhone || '',
      address: '',
      isActive: true,
      createdAt: '',
      updatedAt: '',
      isPatientSelf: true,
      displayLabel: this.buildClientLabel({
        firstName: this.preloadedData.firstName || '',
        lastName: this.preloadedData.lastName || '',
        documentNumber: this.preloadedData.documentNumber || '',
        isPatientSelf: true,
      }),
    }
  }

  onClientSelected(selectedValue: string | ClientOption | null): void {
    const clientId = this.extractClientId(selectedValue)

    if (clientId === this.selfClientOptionId) {
      this.ensurePatientAsClientSelected()
      return
    }

    this.formGroup.patchValue({ clientId: clientId || null })
    this.syncSelectedClientWithControlValue()

    if (clientId) {
      this.ensureSelectedClientInOptions(clientId)
    }
  }

  private ensurePatientAsClientSelected(): void {
    const documentNumber = this.preloadedData?.documentNumber?.trim()
    if (!this.preloadedData?.patientId || !documentNumber) {
      this.formGroup.patchValue({ clientId: null })
      return
    }

    const existingClient = this.clients.find(
      (client) =>
        !client.isPatientSelf &&
        (client.documentNumber || '').trim() === documentNumber
    )

    if (existingClient?.id) {
      this.formGroup.patchValue({ clientId: existingClient.id })
      this.syncSelectedClientWithControlValue()
      return
    }

    const createDto: CreateClientDto = {
      firstName: this.preloadedData.firstName || '',
      lastName: this.preloadedData.lastName || '',
      email: this.preloadedData.email || '',
      documentNumber,
      mobilePhone: this.preloadedData.mobilePhone || '',
      homePhone: this.preloadedData.homePhone || '',
      address: '',
    }

    this.clientsLoading = true
    this._clientsService
      .create(this.preloadedData.patientId, createDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdClient) => {
          const normalizedClient = createdClient as ClientOption
          this.clients = this.buildClientOptions(
            [
              normalizedClient,
              ...this.clients.filter(
                (client) => client.id !== normalizedClient.id && !client.isPatientSelf
              ),
            ]
          )
          this.formGroup.patchValue({ clientId: normalizedClient.id })
          this.syncSelectedClientWithControlValue()
          this.clientsLoading = false
        },
        error: () => {
          this.clientsLoading = false
          this.formGroup.patchValue({ clientId: null })
          this._notificationService.showNotification({
            type: 'error',
            message: {
              es: 'No se pudo asignar el paciente como cliente',
              en: 'Could not assign patient as client',
            },
          })
        },
      })
  }

  openClientModal(): void {
    if (!this.preloadedData?.patientId) {
      this._notificationService.showNotification({
        type: 'error',
        message: 'ERROR.PATIENT_NOT_SELECTED',
      })
      return
    }

    const modalRef = this._modalService.open(ClientModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    })

    modalRef.componentInstance.mode = 'create'
    modalRef.componentInstance.patientId = this.preloadedData.patientId

    modalRef.result.then(
      (result: Client) => {
        const normalizedClient = result as ClientOption
        this.clients = this.buildClientOptions(
          [
            normalizedClient,
            ...this.clients.filter(
              (client) => client.id !== normalizedClient.id && !client.isPatientSelf
            ),
          ]
        )
        this.formGroup.patchValue({ clientId: result.id })
        this.syncSelectedClientWithControlValue()
        this._notificationService.showNotification({
          type: 'success',
          message: 'CLIENT.CREATED',
        })
      },
      () => {},
    )
  }

  get userDisplayName(): string {
    if (this.preloadedData) {
      return `${this.preloadedData.firstName || ''} ${this.preloadedData.lastName || ''}`.trim()
    }
    return ''
  }

  get userDocumentNumber(): string {
    return this.preloadedData?.documentNumber || ''
  }

  get userEmail(): string {
    return this.preloadedData?.email || ''
  }

  get userMobilePhone(): string {
    return this.preloadedData?.mobilePhone || ''
  }

  get userHomePhone(): string {
    return this.preloadedData?.homePhone || ''
  }

  compareClients = (
    a: string | ClientOption | null,
    b: string | ClientOption | null
  ): boolean => {
    return this.extractClientId(a) === this.extractClientId(b)
  }

  public searchClient(term: string, item: ClientOption): boolean {
    const normalizedTerm = (term || '').trim().toLowerCase()
    if (!normalizedTerm) {
      return true
    }

    const fullName = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase()
    const document = (item.documentNumber || '').toLowerCase()
    return fullName.includes(normalizedTerm) || document.includes(normalizedTerm)
  }

  public resolveClientOption(
    value: string | ClientOption | null | undefined
  ): ClientOption | null {
    if (!value) {
      return null
    }

    if (typeof value === 'object') {
      return value
    }

    const fromList = this.clients.find((client) => client.id === value)
    if (fromList) {
      return fromList
    }

    if (this.selectedClient?.id === value) {
      return this.selectedClient
    }

    return null
  }

  private initializeClientControlSync(): void {
    if (this.clientControlSyncInitialized || !this.formGroup) {
      return
    }

    const clientControl = this.formGroup.get('clientId')
    if (!clientControl) {
      return
    }

    clientControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const clientId = this.extractClientId(value)
        this.syncSelectedClientWithControlValue()

        if (clientId) {
          this.ensureSelectedClientInOptions(clientId)
        }
      })

    this.clientControlSyncInitialized = true
  }

  private syncSelectedClientWithControlValue(): void {
    if (!this.formGroup) {
      this.selectedClient = null
      return
    }

    const clientControl = this.formGroup.get('clientId')
    const currentClientId = this.extractClientId(clientControl?.value)

    if (!currentClientId) {
      this.selectedClient = null
      return
    }

    const matchedClient = this.clients.find((client) => client.id === currentClientId) || null
    this.selectedClient = matchedClient

    if (matchedClient && clientControl && clientControl.value !== matchedClient.id) {
      clientControl.patchValue(matchedClient.id, { emitEvent: false })
    }
  }

  private ensureSelectedClientInOptions(clientId: string): void {
    if (
      !clientId ||
      clientId === this.selfClientOptionId ||
      !this.preloadedData?.patientId ||
      this.clients.some((client) => client.id === clientId) ||
      this.loadingClientIds.has(clientId)
    ) {
      return
    }

    this.loadingClientIds.add(clientId)

    this._clientsService
      .getById(this.preloadedData.patientId, clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (client) => {
          if (client) {
            this.clients = this.buildClientOptions([
              client,
              ...this.clients.filter((item) => item.id !== client.id),
            ])
            this.syncSelectedClientWithControlValue()
          }

          this.loadingClientIds.delete(clientId)
        },
        error: () => {
          this.loadingClientIds.delete(clientId)
        },
      })
  }

  private extractClientId(
    value: string | ClientOption | null | undefined
  ): string | null {
    if (!value) {
      return null
    }

    if (typeof value === 'string') {
      const normalized = value.trim()
      return normalized || null
    }

    const normalized = String(value.id || '').trim()
    return normalized || null
  }
}
