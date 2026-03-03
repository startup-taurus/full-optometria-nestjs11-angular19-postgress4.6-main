import { CommonModule } from '@angular/common'
import {
  Component,
  OnInit,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
} from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { NgbModule, NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap'
import { ToastrService } from 'ngx-toastr'
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { selectSelectedBranchId } from '@core/states/branch/branch.selectors'
import { BranchFilterState } from '@core/services/api/branch.service'
import { PageTitleComponent } from '../../../../shared/components/layouts/page-title/page-title.component'
import { SideFilterPanelComponent } from '../../../../shared/components/filters/side-filter-panel/side-filter-panel.component'
import { InfiniteScrollDirective } from '../../../../shared/directives/infinite-scroll.directive'
import { FilterShiftManagementComponent } from '../filters/filter-shift-management/filter-shift-management.component'
import { ShiftModalComponent } from '../modals/shift-modal/shift-modal.component'
import { ChangeStatusModalComponent } from '../modals/change-status-modal/change-status-modal.component'
import { ViewShiftModalComponent } from '../modals/view-shift-modal/view-shift-modal.component'
import { ClinicalHistoryUpsertModalComponent } from '../../../medical-history/components/modals/clinical-history-upsert-modal.component'
import { ShiftsService } from '../../../../core/services/api/shifts.service'
import { ShiftStatusService } from '../../../../core/services/api/shift-status.service'
import {
  Shift,
  ShiftStatus,
  QueryShiftDto,
} from '../../../../core/interfaces/api/shift.interface'
import { environment } from '../../../../../environments/environment'
import Swal from 'sweetalert2'
import { SWAL_DELETE_CONFIRM_CONFIG, SWAL_SUCCESS_CONFIG, SWAL_ERROR_CONFIG } from '@core/helpers/ui/ui.constants'

interface ShiftAppointment {
  id: string
  patientName: string
  patientId: string
  date: string
  phone: string
  email: string
  status: 'confirmed' | 'pending' | 'cancelled'
  profileImage: string
  doctor?: string
}

@Component({
  selector: 'table-shift-management',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PageTitleComponent,
    NgbModule,
    SideFilterPanelComponent,
    InfiniteScrollDirective,
  ],
  templateUrl: './table-shift-management.component.html',
  styleUrl: './table-shift-management.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableShiftManagementComponent implements OnInit, OnDestroy {
  public shifts: Shift[] = []
  public shiftStatuses: ShiftStatus[] = []
  public loading = false
  public showFloatingMenu: string | null = null
  public sideFilterComponent = FilterShiftManagementComponent
  public currentPage = 1
  public totalItems = 0
  public hasMore = true
  public pageSize = 10
  public fileBaseUrl = environment.fileBaseUrl

  private destroy$ = new Subject<void>()
  private currentFilters: QueryShiftDto = {}
  private isInitialLoad = true

  @ViewChild('sideFilterPanel', { static: false })
  public sideFilterPanel?: SideFilterPanelComponent

  constructor(
    private shiftsService: ShiftsService,
    private shiftStatusService: ShiftStatusService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private store: Store<AppState>,
    config: NgbModalConfig
  ) {
    config.backdrop = 'static'
    config.keyboard = false
  }

  ngOnInit(): void {
    this.loadShiftStatuses()
    this.initializeBranchFilter()
    this.initializeFilterSubscription()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeBranchFilter(): void {
    this.store
      .select(selectSelectedBranchId)
      .pipe(takeUntil(this.destroy$), distinctUntilChanged(), debounceTime(300))
      .subscribe({
        next: (branchId) => {
          if (!this.isInitialLoad) {
            this.resetAndLoad()
          }
        },
        error: (error) => {},
      })
  }

  private initializeFilterSubscription(): void {
    this.loadShiftsWithBranchFilter()
  }

  public reloadData(): void {
    this.resetAndLoad()
  }

  public onSideFilterApplied(filters: QueryShiftDto): void {
    this.currentFilters = filters
    this.resetAndLoad()
  }

  public onSideFilterCleared(): void {
    this.currentFilters = {}
    this.resetAndLoad()
  }

  private resetAndLoad(): void {
    this.currentPage = 1
    this.shifts = []
    this.hasMore = true
    this.loadShiftsWithBranchFilter()
  }

  private loadShiftsWithBranchFilter(): void {
    const mergedFilters = this.getMergedFilters()
    this.loadShifts(mergedFilters)
  }

  private getMergedFilters(): QueryShiftDto {
    // El filtro de sucursal se aplica automáticamente en el servicio
    // a través del interceptor o el servicio base
    return {
      ...this.currentFilters,
    }
  }

  private loadShiftStatuses(): void {
    this.shiftStatusService
      .findAllStatuses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.shiftStatuses = Array.isArray(response.data)
            ? response.data
            : response.data?.result || []
        },
        error: (error) => {},
      })
  }

  private loadShifts(filters: QueryShiftDto = {}): void {
    if (this.loading || !this.hasMore) {
      return
    }

    this.loading = true

    const queryParams: QueryShiftDto = {
      page: this.currentPage,
      limit: this.pageSize,
      ...filters,
    }

    this.shiftsService
      .findShifts(queryParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const newShifts = response.data.result || []

          if (this.currentPage === 1) {
            this.shifts = newShifts
          } else {
            this.shifts = [...this.shifts, ...newShifts]
          }

          this.totalItems = response.data.totalCount || 0
          this.hasMore = this.shifts.length < this.totalItems

          this.loading = false
          this.isInitialLoad = false
        },
        error: (error) => {
          console.error('[Shift Management] Error loading:', error)
          if (this.currentPage === 1) {
            this.shifts = []
          }
          this.hasMore = false
          this.loading = false
          this.isInitialLoad = false
        },
      })
  }

  public onScrollEnd(): void {
    if (!this.loading && this.hasMore) {
      this.currentPage++
      this.loadShiftsWithBranchFilter()
    }
  }

  public getStatusBadgeClass(statusName: string): string {
    const lowerStatusName = statusName.toLowerCase()
    switch (lowerStatusName) {
      case 'confirmed':
      case 'confirmado':
        return 'bg-success'
      case 'finished':
      case 'finalizado':
        return 'bg-primary'
      case 'pending':
      case 'pendiente':
        return 'bg-warning'
      case 'cancelled':
      case 'cancelado':
        return 'bg-danger'
      default:
        return 'bg-secondary'
    }
  }

  public getStatusTextKey(statusName: string): string {
    const lowerStatusName = statusName.toLowerCase()
    switch (lowerStatusName) {
      case 'confirmed':
      case 'confirmado':
        return 'SHIFT_MANAGEMENT_MODULE.CONFIRMED'
      case 'finished':
      case 'finalizado':
        return 'SHIFT_MANAGEMENT_MODULE.FINALIZED'
      case 'pending':
      case 'pendiente':
        return 'SHIFT_MANAGEMENT_MODULE.PENDING'
      case 'cancelled':
      case 'cancelado':
        return 'SHIFT_MANAGEMENT_MODULE.CANCELLED'
      default:
        return statusName || 'UNKNOWN'
    }
  }

  public getPatientFullName(shift: Shift): string {
    return `${shift.patient.firstName} ${shift.patient.lastName}`
  }

  public getPatientProfileImage(shift: Shift): string {
    return this.formatUrl(shift.patient.profilePhoto)
  }

  private formatUrl(url?: string): string {
    if (!url) {
      return 'assets/images/default-avatar.png'
    }

    let cleanUrl = url.replace('/uploads/uploads/', '/uploads/')

    if (cleanUrl.startsWith('/')) {
      return (
        this.fileBaseUrl + cleanUrl.replace(/ /g, '%20').replace(/\\/g, '/')
      )
    }
    return (
      this.fileBaseUrl + '/' + cleanUrl.replace(/ /g, '%20').replace(/\\/g, '/')
    )
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement
    if (target && target.src.indexOf('default-avatar.png') === -1) {
      target.src = 'assets/images/default-avatar.png'
    }
  }

  public formatAppointmentDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  public onViewShift(shift: Shift): void {
    const modalRef = this.modalService.open(ViewShiftModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    })

    modalRef.componentInstance.selectedShift = shift

    this.showFloatingMenu = null
  }

  public onEditShift(shift: Shift): void {
    const modalRef = this.modalService.open(ShiftModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    })

    modalRef.componentInstance.editMode = true
    modalRef.componentInstance.selectedShift = shift

    modalRef.result
      .then((result) => {
        if (result?.success) {
          this.reloadData()
        }
      })
      .catch(() => {})

    this.showFloatingMenu = null
  }

  public onChangeStatus(shift: Shift): void {
    const modalRef = this.modalService.open(ChangeStatusModalComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    })

    modalRef.componentInstance.selectedShift = shift

    modalRef.result
      .then((result) => {
        if (result?.success) {
          this.reloadData()
        }
      })
      .catch(() => {})

    this.showFloatingMenu = null
  }

  public onCreateClinicalHistory(shift: Shift): void {
    const modalRef = this.modalService.open(
      ClinicalHistoryUpsertModalComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
      }
    )

    modalRef.componentInstance.preSelectedPatientId = shift.patient.id
    modalRef.componentInstance.editMode = false
    modalRef.componentInstance.fromShiftFlow = true
    modalRef.componentInstance.sourceShiftId = shift.id

    modalRef.result
      .then((result) => {
        if (result?.success) {
          this.toastr.success('Historial clínico creado exitosamente', 'Éxito')
        }
      })
      .catch((error) => {})

    this.showFloatingMenu = null
  }

  public toggleFloatingMenu(shiftId: string): void {
    this.showFloatingMenu = this.showFloatingMenu === shiftId ? null : shiftId
  }

  public hasPhoneNumber(shift: Shift): boolean {
    return !!(shift.patient?.mobilePhone || shift.patient?.homePhone)
  }

  public hasEmail(shift: Shift): boolean {
    return !!shift.patient?.email
  }

  public onCardClick(shift: Shift, event: Event): void {
    this.onViewShift(shift)
  }

  public onSendWhatsApp(shift: Shift): void {
    const phone = shift.patient?.mobilePhone || shift.patient?.homePhone

    if (!phone) {
      this.toastr.warning(
        'El paciente no tiene número de teléfono registrado',
        'WhatsApp'
      )
      this.showFloatingMenu = null
      return
    }

    const formattedPhone = this.formatPhoneForWhatsApp(phone)

    const patientName = this.getPatientFullName(shift)
    const appointmentDate = this.formatAppointmentDate(shift.appointmentDate)

    const message = `Hola ${patientName}, te recordamos que tienes una cita programada para el ${appointmentDate}. ¡Le esperamos!`
    const encodedMessage = encodeURIComponent(message)

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`

    try {
      window.open(whatsappUrl, '_blank')
    } catch (error) {
      this.toastr.error('Error al abrir WhatsApp', 'Error')
    }

    this.showFloatingMenu = null
  }

  private formatPhoneForWhatsApp(phone: string): string {
    let cleanPhone = phone.replace(/\D/g, '')

    if (!cleanPhone.startsWith('593') && cleanPhone.length <= 10) {
      cleanPhone = '593' + cleanPhone
    }

    return cleanPhone
  }

  public onSendEmail(shift: Shift): void {
    if (!shift.patient?.email) {
      this.toastr.warning(
        'El paciente no tiene email registrado',
        'Correo Electrónico'
      )
      this.showFloatingMenu = null
      return
    }

    const patientName = this.getPatientFullName(shift)
    const appointmentDate = this.formatAppointmentDate(shift.appointmentDate)

    const subject = encodeURIComponent('Recordatorio de Cita Médica')
    const body = encodeURIComponent(
      `Estimado/a ${patientName},\n\n` +
        `Le recordamos que tiene una cita programada para el ${appointmentDate}.\n\n` +
        `Por favor, llegue 15 minutos antes de su hora programada.\n\n` +
        `Si necesita reprogramar o cancelar su cita, por favor contáctenos con anticipación.\n\n` +
        `Gracias por confiar en nosotros.\n\n` +
        `Saludos cordiales`
    )

    const mailtoUrl = `mailto:${shift.patient.email}?subject=${subject}&body=${body}`
    window.open(mailtoUrl, '_blank')
    this.showFloatingMenu = null
  }

  public onPrintShift(shift: Shift): void {
    try {
      const printContent = this.generatePrintContent(shift)

      const printWindow = window.open(
        '',
        '_blank',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      )

      if (!printWindow) {
        this.toastr.error(
          'No se pudo abrir la ventana de impresión. Por favor, habilite las ventanas emergentes para este sitio.',
          'Error de Impresión'
        )
        this.showFloatingMenu = null
        return
      }

      printWindow.document.open()
      printWindow.document.write(printContent)
      printWindow.document.close()

      printWindow.onload = () => {
        setTimeout(() => {
          try {
            printWindow.focus()
            printWindow.print()

            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.close()
              }
            }, 1000)
          } catch (printError) {}
        }, 500)
      }
    } catch (error) {
      this.toastr.error('Error al generar el documento para imprimir', 'Error')
    }

    this.showFloatingMenu = null
  }

  // mover a un componente despues thiss
  private generatePrintContent(shift: Shift): string {
    const patientName = this.getPatientFullName(shift)
    const appointmentDate = this.formatAppointmentDate(shift.appointmentDate)
    const currentDate = new Date().toLocaleDateString('es-ES')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Información de Turno</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .section {
            margin-bottom: 25px;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
          }
          .section h2 {
            color: #007bff;
            border-bottom: 1px solid #007bff;
            padding-bottom: 5px;
            margin-top: 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #555;
          }
          .value {
            color: #333;
          }
          .status-badge {
            padding: 4px 12px;
            border-radius: 15px;
            color: white;
            font-weight: bold;
            background-color: ${shift.status?.color || '#6c757d'};
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
            padding-top: 15px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Información de Turno</h1>
          <p>Documento generado el ${currentDate}</p>
        </div>

        <div class="section">
          <h2>Información del Paciente</h2>
          <div class="info-row">
            <span class="label">Nombre Completo:</span>
            <span class="value">${patientName}</span>
          </div>
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${shift.patient?.email || 'No registrado'}</span>
          </div>
          <div class="info-row">
            <span class="label">Teléfono Móvil:</span>
            <span class="value">${shift.patient?.mobilePhone || 'No registrado'}</span>
          </div>
          <div class="info-row">
            <span class="label">Teléfono Fijo:</span>
            <span class="value">${shift.patient?.homePhone || 'No registrado'}</span>
          </div>
          <div class="info-row">
            <span class="label">Dirección:</span>
            <span class="value">${shift.patient?.address || 'No registrada'}</span>
          </div>
        </div>

        <div class="section">
          <h2>Información del Turno</h2>
          <div class="info-row">
            <span class="label">Fecha y Hora:</span>
            <span class="value">${appointmentDate}</span>
          </div>
          <div class="info-row">
            <span class="label">Estado:</span>
            <span class="value">
              <span class="status-badge">${shift.status?.name || 'Sin estado'}</span>
            </span>
          </div>
          <div class="info-row">
            <span class="label">Sucursal:</span>
            <span class="value">${shift.branch?.name || 'No especificada'}</span>
          </div>
          <div class="info-row">
            <span class="label">Descripción:</span>
            <span class="value">${shift.description || 'Sin descripción'}</span>
          </div>
          ${
            shift.notes
              ? `
          <div class="info-row">
            <span class="label">Notas:</span>
            <span class="value">${shift.notes}</span>
          </div>
          `
              : ''
          }
        </div>

        <div class="footer">
          <p>Este documento fue generado automáticamente el ${currentDate}</p>
          <p>Para cualquier consulta, por favor contacte con recepción</p>
        </div>
      </body>
      </html>
    `
  }

  public onNewShift(): void {
    const modalRef = this.modalService.open(ShiftModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    })

    modalRef.componentInstance.editMode = false
    modalRef.componentInstance.selectedShift = null

    modalRef.result
      .then((result) => {
        if (result?.success) {
          this.reloadData()
        }
      })
      .catch(() => {})
  }

  public onDeleteShift(shift: Shift): void {
    const patientName = this.getPatientFullName(shift)
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: '¿Está seguro?',
      text: `¿Está seguro que desea eliminar el turno de ${patientName}?`,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.shiftsService
          .deleteShift(shift.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.reloadData()
              Swal.fire({
                ...SWAL_SUCCESS_CONFIG,
                title: '¡Eliminado!',
                text: 'El turno ha sido eliminado.',
              })
            },
            error: (error) => {
              console.error('Error deleting shift:', error)
              Swal.fire({
                ...SWAL_ERROR_CONFIG,
                title: 'Error',
                text: 'No se pudo eliminar el turno.',
              })
            },
          })
      }
    })
    this.showFloatingMenu = null
  }
}
