import { Injectable, inject } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import {
  Content,
  TDocumentDefinitions,
  TableCell,
} from 'pdfmake/interfaces'
import * as XLSX from 'xlsx'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { selectUser } from '@core/states/auth/auth.selectors'
import { CompanyLogoService } from './company-logo.service'

export interface ExportColumn<T = any> {
  key?: string
  label: string
  formatter?: (row: T) => string | number | null | undefined
  width?: string | number
}

export interface ExportOptions<T = any> {
  title: string
  filename: string
  columns: ExportColumn<T>[]
  rows: T[]
  branchName?: string
  sheetName?: string
}

@Injectable({ providedIn: 'root' })
export class TableExportService {
  private _store = inject(Store<AppState>)
  private _companyLogoService = inject(CompanyLogoService)

  constructor() {
    if (
      pdfFonts &&
      (pdfFonts as any).pdfMake &&
      (pdfFonts as any).pdfMake.vfs
    ) {
      ;(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs
    }
  }

  public async exportToPdf<T>(options: ExportOptions<T>): Promise<void> {
    const logoBase64 = await this.loadLogoBase64()
    const orientation = options.columns.length > 6 ? 'landscape' : 'portrait'

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageOrientation: orientation,
      pageMargins: [30, 30, 30, 30],
      content: [
        this.buildPdfHeader(options, logoBase64),
        { text: '', margin: [0, 10, 0, 10] },
        this.buildPdfTable(options),
      ],
      styles: {
        title: { fontSize: 14, bold: true, color: '#1976D2' },
        subtitle: { fontSize: 9, color: '#555555' },
        tableHeader: { bold: true, fontSize: 9, color: '#1976D2' },
      },
      defaultStyle: { font: 'Roboto', fontSize: 9 },
      footer: (currentPage, pageCount) => ({
        text: `${currentPage} / ${pageCount}`,
        alignment: 'right',
        fontSize: 8,
        margin: [0, 0, 30, 10],
      }),
    }

    pdfMake.createPdf(docDefinition).download(`${options.filename}.pdf`)
  }

  public async exportToExcel<T>(options: ExportOptions<T>): Promise<void> {
    const headers = options.columns.map((column) => column.label)
    const dataRows = options.rows.map((row) =>
      options.columns.map((column) => this.resolveCellValue(row, column))
    )

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
    worksheet['!cols'] = options.columns.map((_, columnIndex) =>
      this.computeColumnWidth(headers[columnIndex], dataRows, columnIndex)
    )

    this.applyHeaderBold(worksheet, headers.length)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      this.sanitizeSheetName(options.sheetName || options.title)
    )

    XLSX.writeFile(workbook, `${options.filename}.xlsx`)
  }

  private buildPdfHeader(
    options: ExportOptions,
    logoBase64: string
  ): Content {
    const subtitleParts: string[] = []
    if (options.branchName) {
      subtitleParts.push(options.branchName)
    }
    subtitleParts.push(this.formatGenerationDate(new Date()))

    const titleStack: Content = {
      stack: [
        { text: options.title, style: 'title' },
        { text: subtitleParts.join('  ·  '), style: 'subtitle' },
      ],
    }

    if (!logoBase64) {
      return titleStack
    }

    return {
      columns: [
        { image: logoBase64, width: 60, alignment: 'left' },
        titleStack,
      ],
      columnGap: 12,
    }
  }

  private buildPdfTable<T>(options: ExportOptions<T>): Content {
    const headerRow: TableCell[] = options.columns.map((column) => ({
      text: column.label,
      style: 'tableHeader',
      fillColor: '#E3F2FD',
      margin: [2, 4, 2, 4],
    }))

    const bodyRows: TableCell[][] = options.rows.map((row) =>
      options.columns.map((column) => ({
        text: this.formatCellForPdf(this.resolveCellValue(row, column)),
        margin: [2, 3, 2, 3],
      }))
    )

    if (bodyRows.length === 0) {
      bodyRows.push([
        {
          text: 'Sin registros',
          colSpan: options.columns.length,
          alignment: 'center',
          italics: true,
          color: '#999999',
          margin: [2, 6, 2, 6],
        },
        ...options.columns.slice(1).map(() => ({ text: '' })),
      ])
    }

    return {
      table: {
        widths: options.columns.map((column) => column.width ?? '*'),
        headerRows: 1,
        dontBreakRows: true,
        body: [headerRow, ...bodyRows],
      },
      layout: 'lightHorizontalLines',
    }
  }

  private resolveCellValue<T>(row: T, column: ExportColumn<T>): string {
    if (column.formatter) {
      const formatted = column.formatter(row)
      return formatted === null || formatted === undefined
        ? ''
        : String(formatted)
    }

    if (!column.key) {
      return ''
    }

    const resolved = this.resolvePath(row, column.key)
    return resolved === null || resolved === undefined ? '' : String(resolved)
  }

  private resolvePath(source: unknown, path: string): unknown {
    if (source === null || source === undefined) {
      return undefined
    }

    return path
      .split('.')
      .reduce<unknown>((accumulator, key) => {
        if (accumulator === null || accumulator === undefined) {
          return undefined
        }
        return (accumulator as Record<string, unknown>)[key]
      }, source)
  }

  private formatCellForPdf(value: string): string {
    if (!value) {
      return '-'
    }
    return value
  }

  private formatGenerationDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  private computeColumnWidth(
    header: string,
    dataRows: string[][],
    columnIndex: number
  ): XLSX.ColInfo {
    const headerLength = header?.length || 0
    const longestCell = dataRows.reduce((maxLength, row) => {
      const cellLength = String(row[columnIndex] || '').length
      return cellLength > maxLength ? cellLength : maxLength
    }, headerLength)

    const width = Math.min(Math.max(longestCell + 2, 10), 50)
    return { wch: width }
  }

  private applyHeaderBold(
    worksheet: XLSX.WorkSheet,
    columnCount: number
  ): void {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const cellAddress = XLSX.utils.encode_cell({ c: columnIndex, r: 0 })
      const cell = worksheet[cellAddress]
      if (cell) {
        cell.s = { font: { bold: true } }
      }
    }
  }

  private sanitizeSheetName(name: string): string {
    return name.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'Datos'
  }

  private async loadLogoBase64(): Promise<string> {
    try {
      const user = await firstValueFrom(this._store.select(selectUser))
      if (!user?.company?.logoFile?.path) {
        return ''
      }

      const logoUrl = await firstValueFrom(
        this._companyLogoService.getCompanyLogoUrl$()
      )
      const rawBase64 = await this._companyLogoService.convertLogoToBase64(
        logoUrl
      )

      return /^data:image\/(png|jpe?g|webp);base64,/i.test(rawBase64)
        ? rawBase64
        : ''
    } catch {
      return ''
    }
  }
}
