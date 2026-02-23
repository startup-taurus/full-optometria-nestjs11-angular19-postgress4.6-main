import { CommonModule } from '@angular/common'
import {
  Component,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
} from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { NgbModule, NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap'
import { Subject, takeUntil } from 'rxjs'
import { ToastrService } from 'ngx-toastr'
import { PageTitleComponent } from '../../../../shared/components/layouts/page-title/page-title.component'
import { CompanySetupModalComponent } from '../modals/create-company/company-setup-modal.component'
import { ViewCompanyModalComponent } from '../modals/view-company/view-company-modal.component'
import { ChangeStatusCompanyModalComponent } from '../modals/change-status-company/change-status-company-modal.component'
import { CompanyService } from '@core/services/api/company.service'
import {
  Company,
  QueryCompanyDto,
} from '@core/interfaces/api/company.interface'
import { environment } from '@environment/environment'
import Swal from 'sweetalert2'
import {
  SWAL_DELETE_CONFIRM_CONFIG,
  SWAL_SUCCESS_CONFIG,
  SWAL_ERROR_CONFIG,
} from '@core/helpers/ui/ui.constants'

@Component({
  selector: 'table-companies',
  standalone: true,
  imports: [CommonModule, TranslateModule, PageTitleComponent, NgbModule],
  templateUrl: './table-companies.component.html',
  styleUrl: './table-companies.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableCompaniesComponent implements OnInit, OnDestroy {
  public companies: Company[] = []
  public loading = false
  public showFloatingMenu: string | null = null
  public currentPage = 1
  public totalItems = 0
  public pageSize = 10

  private destroy$ = new Subject<void>()
  private companyService = inject(CompanyService)
  private modalService = inject(NgbModal)
  private toastr = inject(ToastrService)

  constructor(config: NgbModalConfig) {
    config.backdrop = 'static'
    config.keyboard = false
  }

  ngOnInit(): void {
    this.loadCompanies()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private loadCompanies(): void {
    this.loading = true

    const queryParams: QueryCompanyDto = {
      page: this.currentPage,
      limit: this.pageSize,
    }

    this.companyService
      .getAllCompanies(queryParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data && response.data.result) {
            this.companies = response.data.result || []
            this.totalItems = response.data.totalCount || 0
          } else {
            this.companies = []
            this.totalItems = 0
          }
          this.loading = false
        },
        error: (error) => {
          this.companies = []
          this.totalItems = 0
          this.loading = false
        },
      })
  }

  public reloadData(): void {
    this.loadCompanies()
  }

  public onNewCompany(): void {
    const modalRef = this.modalService.open(CompanySetupModalComponent, {
      size: 'lg',
      centered: true,
    })

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.reloadData()
        }
      },
      () => {}
    )
  }

  public onViewCompany(company: Company): void {
    const modalRef = this.modalService.open(ViewCompanyModalComponent, {
      size: 'lg',
      centered: true,
    })
    modalRef.componentInstance.selectedCompany = company
  }

  public onChangeStatus(company: Company): void {
    const modalRef = this.modalService.open(ChangeStatusCompanyModalComponent, {
      size: 'md',
      centered: true,
    })
    modalRef.componentInstance.selectedCompany = company

    modalRef.result.then(
      (result) => {
        if (result === 'updated') {
          this.reloadData()
        }
      },
      () => {}
    )
  }

  // public onEditCompany(company: Company): void {
  //   const modalRef = this.modalService.open(CompanySetupModalComponent, {
  //     size: 'lg',
  //     centered: true,
  //   })
  //   modalRef.componentInstance.selectedCompany = company

  //   modalRef.result.then(
  //     (result) => {
  //       if (result?.success) {
  //         this.reloadData()
  //       }
  //     },
  //     () => {}
  //   )
  // }

  public onEditCompany(company: Company): void {
    const modalRef = this.modalService.open(CompanySetupModalComponent, {
      size: 'lg',
      centered: true,
    })
    modalRef.componentInstance.selectedCompany = company
    modalRef.componentInstance.isEditMode = true

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.reloadData()
        }
      },
      () => {}
    )
  }

  public onDeleteCompany(company: Company): void {
    Swal.fire({
      ...SWAL_DELETE_CONFIRM_CONFIG,
      title: '¿Está seguro?',
      text: `¿Desea eliminar la compañia "${company.name}"?`,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.companyService
          .deleteCompany(company.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.reloadData()
              Swal.fire({
                ...SWAL_SUCCESS_CONFIG,
                title: '¡Eliminado!',
                text: 'La compañia ha sido eliminada.',
              })
            },
            error: (error) => {
              Swal.fire({
                ...SWAL_ERROR_CONFIG,
                title: 'Error',
                text: 'No se pudo eliminar la compañia.',
              })
            },
          })
      }
    })
  }

  public getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'bg-success' : 'bg-danger'
  }

  public getStatusText(isActive: boolean): string {
    return isActive ? 'COMPANIES_MODULE.ACTIVE' : 'COMPANIES_MODULE.INACTIVE'
  }

  public getLogoUrl(company: Company): string {
    if (company.logoFile && company.logoFile.path) {
      return `${environment.fileBaseUrl}/${company.logoFile.path}`
    }

    return '/assets/images/ZGames.png'
  }

  public toggleFloatingMenu(companyId: string): void {
    this.showFloatingMenu = this.showFloatingMenu === companyId ? null : companyId
  }

  public onSendWhatsApp(company: Company): void {
    this.showFloatingMenu = null
    if (company.phone) {
      const formattedPhone = this.formatPhoneForWhatsApp(company.phone)

      const message = `Hola, me gustaría obtener información sobre la compañia ${company.name}.`
      const encodedMessage = encodeURIComponent(message)

      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`

      try {
        window.open(whatsappUrl, '_blank')
      } catch (error) {
        this.toastr.error('Error al abrir WhatsApp', 'Error')
      }
    } else {
      this.toastr.warning(
        'Esta compañia no tiene número de teléfono registrado',
        'Sin teléfono'
      )
    }
  }

  private formatPhoneForWhatsApp(phone: string): string {
    let cleanPhone = phone.replace(/\D/g, '')

    if (!cleanPhone.startsWith('593') && cleanPhone.length <= 10) {
      cleanPhone = '593' + cleanPhone
    }

    return cleanPhone
  }

  public onSendEmail(company: Company): void {
    this.showFloatingMenu = null
    if (company.email) {
      const subject = encodeURIComponent(`Consulta - compañia ${company.name}`)
      const mailtoUrl = `mailto:${company.email}?subject=${subject}`
      window.location.href = mailtoUrl
    } else {
      this.toastr.warning(
        'Esta compañia no tiene correo electrónico registrado',
        'Sin correo'
      )
    }
  }

  public onPrintCompany(company: Company): void {
    this.showFloatingMenu = null

    const printWindow = window.open('', '_blank', 'width=800,height=600')

    if (printWindow) {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>compañia - ${company.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              line-height: 1.6;
            }
            h1 {
              color: #333;
              border-bottom: 2px solid #007bff;
              padding-bottom: 10px;
            }
            .info-section {
              margin: 20px 0;
            }
            .info-section h2 {
              color: #555;
              font-size: 18px;
              margin-bottom: 10px;
            }
            .info-row {
              display: flex;
              margin: 8px 0;
            }
            .info-label {
              font-weight: bold;
              width: 200px;
              color: #666;
            }
            .info-value {
              color: #333;
            }
            .status-badge {
              padding: 4px 12px;
              border-radius: 4px;
              color: white;
              display: inline-block;
            }
            .status-active {
              background-color: #28a745;
            }
            .status-inactive {
              background-color: #dc3545;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <h1>Información de compañia</h1>
          
          <div class="info-section">
            <h2>Información General</h2>
            <div class="info-row">
              <div class="info-label">Nombre:</div>
              <div class="info-value">${company.name || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Código:</div>
              <div class="info-value">${company.code || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Correo:</div>
              <div class="info-value">${company.email || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Teléfono:</div>
              <div class="info-value">${company.phone || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Estado:</div>
              <div class="info-value">
                <span class="status-badge ${company.isActive ? 'status-active' : 'status-inactive'}">
                  ${company.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h2>Fechas</h2>
            <div class="info-row">
              <div class="info-label">Fecha de Creación:</div>
              <div class="info-value">${company.createdAt ? new Date(company.createdAt).toLocaleString('es-ES') : 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Última Actualización:</div>
              <div class="info-value">${company.updatedAt ? new Date(company.updatedAt).toLocaleString('es-ES') : 'N/A'}</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `

      printWindow.document.write(printContent)
      printWindow.document.close()
    } else {
      this.toastr.error('No se pudo abrir la ventana de impresión', 'Error')
    }
  }
}
