import { Injectable, inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import {
  Content,
  ContentTable,
  TDocumentDefinitions,
  TableCell,
} from 'pdfmake/interfaces'
import { LaboratoryOrderPdfData } from '@core/interfaces/ui/laboratory-order-pdf.interface'
import { FrameType } from '@core/interfaces/api/laboratory-order.interface'
import { Branch } from '@core/interfaces/api/branch.interface'
import { CompanyLogoService } from './company-logo.service'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { selectUser } from '@core/states/auth/auth.selectors'
import { firstValueFrom } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class LaboratoryOrderPdfService {
  private _translateService = inject(TranslateService)
  private _companyLogoService = inject(CompanyLogoService)
  private _store = inject(Store<AppState>)
  private logoBase64: string = ''

  private isSupportedPdfImageDataUrl(value: string): boolean {
    return /^data:image\/(png|jpe?g|webp);base64,/i.test(value)
  }

  constructor() {
    if (
      pdfFonts &&
      (pdfFonts as any).pdfMake &&
      (pdfFonts as any).pdfMake.vfs
    ) {
      ;(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs
    }

    this.loadLogo()
  }

  private async loadLogo(): Promise<void> {
    try {
      const user = await firstValueFrom(this._store.select(selectUser))
      
      if (user?.company?.logoFile?.path) {
        const logoUrl = await firstValueFrom(this._companyLogoService.getCompanyLogoUrl$())
        const rawLogoBase64 = await this._companyLogoService.convertLogoToBase64(logoUrl)

        if (this.isSupportedPdfImageDataUrl(rawLogoBase64)) {
          this.logoBase64 = rawLogoBase64
        } else {
          this.logoBase64 = ''
        }
      } else {
        this.logoBase64 = ''
      }
    } catch (error) {
      this.logoBase64 = ''
    }
  }

  public async generatePdf(data: LaboratoryOrderPdfData): Promise<void> {
    if (!this.logoBase64) {
      await this.loadLogo()
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    try {
      const docDefinition = this.buildDocumentDefinition(data)
      pdfMake.createPdf(docDefinition).open()
    } catch (error) {
      this.logoBase64 = ''
      const docDefinition = this.buildDocumentDefinition(data)
      pdfMake.createPdf(docDefinition).open()
    }
  }

  public async downloadPdf(
    data: LaboratoryOrderPdfData,
    filename?: string
  ): Promise<void> {
    if (!this.logoBase64) {
      await this.loadLogo()
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    const pdfFileName = filename || `orden_laboratorio_${data.orderNumber}.pdf`

    try {
      const docDefinition = this.buildDocumentDefinition(data)
      pdfMake.createPdf(docDefinition).download(pdfFileName)
    } catch (error) {
      this.logoBase64 = ''
      const docDefinition = this.buildDocumentDefinition(data)
      pdfMake.createPdf(docDefinition).download(pdfFileName)
    }
  }

  private buildDocumentDefinition(
    data: LaboratoryOrderPdfData
  ): TDocumentDefinitions {
    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content: [
        this.buildHeader(data),
        { text: '', margin: [0, 10, 0, 10] },
        this.buildCustomerSection(data),
        { text: '', margin: [0, 10, 0, 10] },
        this.buildProductSection(data),
        { text: '', margin: [0, 10, 0, 10] },
        this.buildDesignParametersSection(data),
        { text: '', margin: [0, 10, 0, 10] },
        this.buildFrameDataSection(data),
        { text: '', margin: [0, 15, 0, 0] },
        this.buildSignatureSection(),
      ],
      styles: this.getStyles(),
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
      },
    }
  }

  private buildHeader(data: LaboratoryOrderPdfData): Content {
    const branch = data.branch
    const orderNumber = data.orderNumber

    return {
      columns: [
        {
          width: '60%',
          stack: [
            {
              text: branch.name || '',
              style: 'branchName',
              bold: true,
            },
            {
              text: `RUC: ${branch.code || 'N/A'}`,
              style: 'branchInfo',
            },
            {
              text: `${this._translateService.instant('PDF.LABORATORY_ORDER.ADDRESS')}: ${branch.address || ''}`,
              style: 'branchInfo',
            },
            {
              text: `Email: ${branch.corporateEmail || ''}`,
              style: 'branchInfo',
            },
            {
              text: `${this._translateService.instant('PDF.LABORATORY_ORDER.PHONE')}: ${branch.phone || ''}`,
              style: 'branchInfo',
            },
            {
              text: `${branch.city || ''}, Ecuador`,
              style: 'branchInfo',
            },
          ],
        },
        {
          width: '40%',
          stack: [
            this.logoBase64
              ? {
                  image: this.logoBase64,
                  width: 120,
                  alignment: 'right',
                  margin: [0, 0, 0, 10],
                }
              : { 
                  text: this._companyLogoService.getNoLogoText(),
                  style: 'noLogo',
                  alignment: 'right',
                  margin: [0, 0, 0, 10],
                },
            {
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      text: this._translateService.instant(
                        'PDF.LABORATORY_ORDER.TITLE'
                      ),
                      style: 'orderTitle',
                      alignment: 'center',
                      border: [true, true, true, true],
                      fillColor: '#E3F2FD',
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: () => 2,
                vLineWidth: () => 2,
                hLineColor: () => '#1976D2',
                vLineColor: () => '#1976D2',
              },
            },
            {
              text: orderNumber,
              style: 'orderNumber',
              alignment: 'center',
              margin: [0, 5, 0, 0],
            },
          ],
        },
      ],
    }
  }

  private buildCustomerSection(data: LaboratoryOrderPdfData): Content {
    const order = data.order
    const patient = order.patient

    return {
      stack: [
        {
          text: this._translateService.instant(
            'PDF.LABORATORY_ORDER.CUSTOMER_DATA'
          ),
          style: 'sectionTitle',
        },
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                {
                  text: [
                    {
                      text: `${this._translateService.instant('PDF.LABORATORY_ORDER.FULL_NAME')}: `,
                      bold: true,
                    },
                    `${patient?.firstName || ''} ${patient?.lastName || ''}`,
                  ],
                },
                {
                  text: [
                    {
                      text: `${this._translateService.instant('PDF.LABORATORY_ORDER.ATTENDANCE_DATE')}: `,
                      bold: true,
                    },
                    this.formatDate(order.attendanceDate),
                  ],
                },
              ],
              [
                {
                  text: [
                    {
                      text: `${this._translateService.instant('PDF.LABORATORY_ORDER.DELIVERY_DATE')}: `,
                      bold: true,
                    },
                    this.formatDate(order.deliveryDate),
                  ],
                },
                { text: '' },
              ],
            ],
          },
          layout: 'noBorders',
        },
      ],
    }
  }

  private buildProductSection(data: LaboratoryOrderPdfData): Content {
    const order = data.order

    return {
      stack: [
        {
          text: this._translateService.instant('PDF.LABORATORY_ORDER.PRODUCT'),
          style: 'sectionTitle',
        },
        {
          table: {
            widths: ['10%', '15%', '15%', '15%', '15%', '15%', '15%'],
            headerRows: 1,
            body: [
              [
                { text: '', bold: true, fillColor: '#E3F2FD' },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.SPHERE'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.CYLINDER'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.AXIS'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.ADD'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.HEIGHT'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.DNP'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
              ],
              [
                { text: 'OD', bold: true, fillColor: '#F5F5F5' },
                { text: order.odSphere || '-', alignment: 'center' },
                { text: order.odCylinder || '-', alignment: 'center' },
                { text: order.odAxis || '-', alignment: 'center' },
                { text: order.odAdd || '-', alignment: 'center' },
                { text: order.odHeight || '-', alignment: 'center' },
                { text: order.odDnp || '-', alignment: 'center' },
              ],
              [
                { text: 'OI', bold: true, fillColor: '#F5F5F5' },
                { text: order.oiSphere || '-', alignment: 'center' },
                { text: order.oiCylinder || '-', alignment: 'center' },
                { text: order.oiAxis || '-', alignment: 'center' },
                { text: order.oiAdd || '-', alignment: 'center' },
                { text: order.oiHeight || '-', alignment: 'center' },
                { text: order.oiDnp || '-', alignment: 'center' },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#CCCCCC',
            vLineColor: () => '#CCCCCC',
          },
        },
        { text: '', margin: [0, 10, 0, 0] },
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            headerRows: 1,
            body: [
              [
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.CBASE'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.SUN_DEGREE'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.PRISM'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.BASE'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
              ],
              [
                { text: order.cbase || '-', alignment: 'center' },
                { text: order.sunDegree || '-', alignment: 'center' },
                { text: order.prism || '-', alignment: 'center' },
                { text: order.base || '-', alignment: 'center' },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#CCCCCC',
            vLineColor: () => '#CCCCCC',
          },
        },
      ],
    }
  }

  private buildDesignParametersSection(data: LaboratoryOrderPdfData): Content {
    const order = data.order

    return {
      stack: [
        {
          text: this._translateService.instant(
            'PDF.LABORATORY_ORDER.DESIGN_PARAMETERS'
          ),
          style: 'sectionTitle',
        },
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            headerRows: 1,
            body: [
              [
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.HORIZONTAL'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.VERTICAL'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.LARGER_DIAMETER'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.BRIDGE'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
              ],
              [
                { text: order.frameHorizontal || '-', alignment: 'center' },
                { text: order.frameVertical || '-', alignment: 'center' },
                { text: order.frameLargerDiameter || '-', alignment: 'center' },
                { text: order.frameBridge || '-', alignment: 'center' },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#CCCCCC',
            vLineColor: () => '#CCCCCC',
          },
        },
        { text: '', margin: [0, 5, 0, 5] },
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: `${this._translateService.instant('PDF.LABORATORY_ORDER.OBSERVATIONS')}:`,
                  bold: true,
                },
              ],
              [{ text: order.observations || '-' }],
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ],
    }
  }

  private buildFrameDataSection(data: LaboratoryOrderPdfData): Content {
    const order = data.order
    const productSectionTitle = this.getProductSectionTitle(order)
    const productNames = this.getProductNames(order)

    return {
      stack: [
        {
          text: productSectionTitle,
          style: 'sectionTitle',
        },
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                {
                  text: `${this._translateService.instant('PDF.LABORATORY_ORDER.FRAME_TYPE')}:`,
                  bold: true,
                },
                { text: this.getFrameTypeLabel(order.frameType) },
              ],
              [
                {
                  text: `${this._translateService.instant('PDF.LABORATORY_ORDER.FRAME_TYPE_DESC')}:`,
                  bold: true,
                },
                { text: order.frameTypeDescription || '-' },
              ],
              [
                {
                  text: `${this._translateService.instant('PDF.LABORATORY_ORDER.PRODUCTS')}:`,
                  bold: true,
                },
                { text: productNames },
              ],
              [
                {
                  text: `${this._translateService.instant('PDF.LABORATORY_ORDER.BRAND')}:`,
                  bold: true,
                },
                { text: order.frameBrand || '-' },
              ],
              [
                {
                  text: `${this._translateService.instant('PDF.LABORATORY_ORDER.OTHER_PRODUCT_DATA')}:`,
                  bold: true,
                },
                { text: order.frameData || '-' },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ],
    }
  }

  private buildSignatureSection(): Content {
    return {
      columns: [
        {
          width: '50%',
          stack: [
            { text: '', margin: [0, 20, 0, 0] },
            {
              canvas: [
                {
                  type: 'line',
                  x1: 0,
                  y1: 0,
                  x2: 200,
                  y2: 0,
                  lineWidth: 1,
                },
              ],
              margin: [0, 0, 0, 5],
            },
            {
              text: this._translateService.instant(
                'PDF.LABORATORY_ORDER.SIGNATURE_VISIONARY'
              ),
              alignment: 'center',
              bold: true,
            },
          ],
        },
        {
          width: '50%',
          stack: [
            { text: '', margin: [0, 20, 0, 0] },
            {
              canvas: [
                {
                  type: 'line',
                  x1: 0,
                  y1: 0,
                  x2: 200,
                  y2: 0,
                  lineWidth: 1,
                },
              ],
              margin: [0, 0, 0, 5],
            },
            {
              text: this._translateService.instant(
                'PDF.LABORATORY_ORDER.SIGNATURE_CUSTOMER'
              ),
              alignment: 'center',
              bold: true,
            },
          ],
        },
      ],
    }
  }

  private getStyles(): any {
    return {
      branchName: {
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 3],
      },
      branchInfo: {
        fontSize: 9,
        margin: [0, 1, 0, 1],
      },
      orderTitle: {
        fontSize: 11,
        bold: true,
        color: '#1976D2',
      },
      orderNumber: {
        fontSize: 16,
        bold: true,
        color: '#D32F2F',
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        margin: [0, 5, 0, 10],
        color: '#1976D2',
      },
      noLogo: {
        fontSize: 10,
        italics: true,
        color: '#999999',
      },
    }
  }

  private formatDate(date: string | null): string {
    if (!date) return '-'
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  }

  private getFrameTypeLabel(frameType?: FrameType): string {
    if (!frameType) return '-'

    const labels: Record<FrameType, string> = {
      [FrameType.THREE_PIECES_AIR]: this._translateService.instant(
        'PDF.LABORATORY_ORDER.FRAME_TYPE_THREE_PIECES'
      ),
      [FrameType.SEMI_AIR_GROOVED]: this._translateService.instant(
        'PDF.LABORATORY_ORDER.FRAME_TYPE_SEMI_AIR'
      ),
      [FrameType.COMPLETE]: this._translateService.instant(
        'PDF.LABORATORY_ORDER.FRAME_TYPE_COMPLETE'
      ),
    }

    return labels[frameType] || frameType
  }

  private getOrderProducts(order: any): Array<{
    id?: string
    name?: string
    brand?: string
    code?: string
  }> {
    if (Array.isArray(order?.products) && order.products.length > 0) {
      return order.products
    }

    if (order?.product) {
      return [order.product]
    }

    return []
  }

  private getProductNames(order: any): string {
    const products = this.getOrderProducts(order)

    if (products.length > 0) {
      return products.map((product) => product.name || '-').join(', ')
    }

    return order.frameModel || '-'
  }

  private getProductSectionTitle(order: any): string {
    const products = this.getOrderProducts(order)

    return this._translateService.instant(
      products.length > 1
        ? 'PDF.LABORATORY_ORDER.PRODUCTS_DATA'
        : 'PDF.LABORATORY_ORDER.PRODUCT_DATA'
    )
  }
}
