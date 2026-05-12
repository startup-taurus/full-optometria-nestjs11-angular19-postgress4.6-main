import { CommonModule } from '@angular/common'
import { Component, Input, inject } from '@angular/core'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import Swal from 'sweetalert2'
import {
  ExportColumn,
  TableExportService,
} from '@core/services/ui/table-export.service'

@Component({
  selector: 'table-export-buttons',
  standalone: true,
  imports: [CommonModule, NgbModule, TranslateModule],
  templateUrl: './table-export-buttons.component.html',
  host: { class: 'd-inline-flex gap-2' },
})
export class TableExportButtonsComponent<T = any> {
  @Input({ required: true }) public columns: ExportColumn<T>[] = []
  @Input({ required: true }) public rows: T[] = []
  @Input({ required: true }) public filenameBase = ''
  @Input() public title = ''
  @Input() public branchName?: string
  @Input() public sheetName?: string
  @Input() public disabled = false
  @Input() public showPdf = true
  @Input() public showExcel = true

  public isExportingPdf = false
  public isExportingExcel = false

  private _exportService = inject(TableExportService)

  public get isBusy(): boolean {
    return this.isExportingPdf || this.isExportingExcel
  }

  public async onExportPdf(): Promise<void> {
    if (this.disabled || this.isBusy) {
      return
    }

    if (!this.hasData()) {
      this.showNoDataAlert()
      return
    }

    this.isExportingPdf = true

    try {
      await this._exportService.exportToPdf({
        title: this.title || this.filenameBase,
        filename: this.buildFilename(),
        columns: this.columns,
        rows: this.rows,
        branchName: this.branchName,
      })
    } catch {
      this.showErrorAlert()
    } finally {
      this.isExportingPdf = false
    }
  }

  public async onExportExcel(): Promise<void> {
    if (this.disabled || this.isBusy) {
      return
    }

    if (!this.hasData()) {
      this.showNoDataAlert()
      return
    }

    this.isExportingExcel = true

    try {
      await this._exportService.exportToExcel({
        title: this.title || this.filenameBase,
        filename: this.buildFilename(),
        columns: this.columns,
        rows: this.rows,
        branchName: this.branchName,
        sheetName: this.sheetName,
      })
    } catch {
      this.showErrorAlert()
    } finally {
      this.isExportingExcel = false
    }
  }

  private hasData(): boolean {
    return Array.isArray(this.rows) && this.rows.length > 0
  }

  private buildFilename(): string {
    const base = (this.filenameBase || 'export')
      .toLowerCase()
      .replace(/\s+/g, '-')
    const today = new Date().toISOString().split('T')[0]
    return `${base}-${today}`
  }

  private showNoDataAlert(): void {
    Swal.fire({
      title: 'Sin registros',
      text: 'No hay datos para exportar en esta vista.',
      icon: 'info',
      timer: 2000,
      showConfirmButton: false,
    })
  }

  private showErrorAlert(): void {
    Swal.fire({
      title: 'Error al exportar',
      text: 'No fue posible generar el archivo. Intenta nuevamente.',
      icon: 'error',
    })
  }
}
