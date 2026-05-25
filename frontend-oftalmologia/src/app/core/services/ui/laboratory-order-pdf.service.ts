import { Injectable, inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
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

  public async generatePdf(
    data: LaboratoryOrderPdfData,
    pageSize: 'A4' | 'A5' = 'A4'
  ): Promise<void> {
    if (!this.logoBase64) {
      await this.loadLogo()
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    try {
      const docDefinition = this.buildDocumentDefinition(data, pageSize)
      pdfMake.createPdf(docDefinition).open()
    } catch (error) {
      this.logoBase64 = ''
      const docDefinition = this.buildDocumentDefinition(data, pageSize)
      pdfMake.createPdf(docDefinition).open()
    }
  }

  public async downloadPdf(
    data: LaboratoryOrderPdfData,
    filename?: string,
    pageSize: 'A4' | 'A5' = 'A4'
  ): Promise<void> {
    if (!this.logoBase64) {
      await this.loadLogo()
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    const pdfFileName = filename || `orden_laboratorio_${data.orderNumber}.pdf`

    try {
      const docDefinition = this.buildDocumentDefinition(data, pageSize)
      pdfMake.createPdf(docDefinition).download(pdfFileName)
    } catch (error) {
      this.logoBase64 = ''
      const docDefinition = this.buildDocumentDefinition(data, pageSize)
      pdfMake.createPdf(docDefinition).download(pdfFileName)
    }
  }

  private buildDocumentDefinition(
    data: LaboratoryOrderPdfData,
    pageSize: 'A4' | 'A5'
  ): TDocumentDefinitions {
    const isCompact = pageSize === 'A5'
    const margins: [number, number, number, number] = isCompact
      ? [24, 24, 24, 24]
      : [40, 40, 40, 40]
    const sectionGap = isCompact ? 5 : 10
    const signatureGap = isCompact ? 8 : 15
    const fontSize = isCompact ? 8 : 10

    return {
      pageSize,
      pageMargins: margins,
      content: [
        this.buildHeader(data, isCompact),
        { text: '', margin: [0, sectionGap, 0, sectionGap] },
        this.buildCustomerSection(data),
        { text: '', margin: [0, sectionGap, 0, sectionGap] },
        this.buildProductSection(data),
        { text: '', margin: [0, sectionGap, 0, sectionGap] },
        this.buildDesignParametersSection(data),
        { text: '', margin: [0, sectionGap, 0, sectionGap] },
        this.buildFrameDataSection(data),
        { text: '', margin: [0, signatureGap, 0, 0] },
        this.buildSignatureSection(isCompact),
      ],
      styles: this.getStyles(isCompact),
      defaultStyle: {
        font: 'Roboto',
        fontSize,
      },
    }
  }

  private buildHeader(
    data: LaboratoryOrderPdfData,
    isCompact: boolean = false
  ): Content {
    const branch = data.branch
    const orderNumber = data.orderNumber
    const logoWidth = isCompact ? 80 : 120

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
                  width: logoWidth,
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
                    `${patient?.lastName || ''} ${patient?.firstName || ''}`,
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
          text: this._translateService.instant(
            'PDF.LABORATORY_ORDER.DIGITAL_PARAMETERS'
          ),
          style: 'sectionTitle',
        },
        {
          table: {
            widths: ['20%', '20%', '20%', '20%', '20%'],
            headerRows: 1,
            body: [
              [
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.D_VERTEX'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.PANTOS'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.PANORA'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.DIST_VP'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
                {
                  text: this._translateService.instant(
                    'PDF.LABORATORY_ORDER.ENGRAVING'
                  ),
                  bold: true,
                  alignment: 'center',
                  fillColor: '#E3F2FD',
                },
              ],
              [
                { text: order.dVertex || '-', alignment: 'center' },
                { text: order.pantos || '-', alignment: 'center' },
                { text: order.panora || '-', alignment: 'center' },
                { text: order.distVp || '-', alignment: 'center' },
                { text: order.engraving || '-', alignment: 'center' },
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
    const productRows = this.getProductRows(order)
    const hasProducts = productRows.length > 0
    const productTableBody =
      hasProducts
        ? [
            [
              { text: 'Código', bold: true, fillColor: '#E3F2FD' },
              { text: 'Producto', bold: true, fillColor: '#E3F2FD' },
              { text: 'Marca', bold: true, fillColor: '#E3F2FD' },
              { text: 'Cant.', bold: true, alignment: 'center', fillColor: '#E3F2FD' },
            ],
            ...productRows,
          ]
        : [
            [
              {
                text: 'Sin productos',
                colSpan: 4,
                alignment: 'center',
                margin: [0, 4, 0, 4],
              },
              {},
              {},
              {},
            ],
          ]

    return {
      stack: [
        {
          text: productSectionTitle,
          style: 'sectionTitle',
        },
        {
          table: {
            widths: ['20%', '40%', '25%', '15%'],
            headerRows: hasProducts ? 1 : 0,
            dontBreakRows: true,
            body: productTableBody,
          },
          layout: 'lightHorizontalLines',
        },
        { text: '', margin: [0, 8, 0, 4] },
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

  private buildSignatureSection(isCompact: boolean = false): Content {
    const lineLength = isCompact ? 150 : 200
    const topGap = isCompact ? 14 : 20

    return {
      columns: [
        {
          width: '50%',
          stack: [
            { text: '', margin: [0, topGap, 0, 0] },
            {
              canvas: [
                {
                  type: 'line',
                  x1: 0,
                  y1: 0,
                  x2: lineLength,
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
            { text: '', margin: [0, topGap, 0, 0] },
            {
              canvas: [
                {
                  type: 'line',
                  x1: 0,
                  y1: 0,
                  x2: lineLength,
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

  private getStyles(isCompact: boolean = false): any {
    return {
      branchName: {
        fontSize: isCompact ? 10 : 12,
        bold: true,
        margin: [0, 0, 0, 3],
      },
      branchInfo: {
        fontSize: isCompact ? 7 : 9,
        margin: [0, 1, 0, 1],
      },
      orderTitle: {
        fontSize: isCompact ? 9 : 11,
        bold: true,
        color: '#1976D2',
      },
      orderNumber: {
        fontSize: isCompact ? 13 : 16,
        bold: true,
        color: '#D32F2F',
      },
      sectionTitle: {
        fontSize: isCompact ? 10 : 12,
        bold: true,
        margin: [0, 5, 0, 8],
        color: '#1976D2',
      },
      noLogo: {
        fontSize: isCompact ? 8 : 10,
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
    unitPrice?: number
  }> {
    if (Array.isArray(order?.products) && order.products.length > 0) {
      return order.products
    }

    if (order?.product) {
      return [order.product]
    }

    return []
  }

  private getProductRows(order: any): any[] {
    const lineItems = Array.isArray(order?.lineItems) ? order.lineItems : []

    if (lineItems.length > 0) {
      return lineItems.map((lineItem: any) => [
        { text: lineItem.product?.code || '-', margin: [0, 2, 0, 2] },
        { text: lineItem.product?.name || '-', margin: [0, 2, 0, 2] },
        { text: lineItem.product?.brand || '-', margin: [0, 2, 0, 2] },
        {
          text: String(Number(lineItem.quantity || 1)),
          alignment: 'center',
          margin: [0, 2, 0, 2],
        },
      ])
    }

    const products = this.getOrderProducts(order)

    if (products.length > 0) {
      return products.map((product) => [
        { text: product.code || '-', margin: [0, 2, 0, 2] },
        { text: product.name || '-', margin: [0, 2, 0, 2] },
        { text: product.brand || '-', margin: [0, 2, 0, 2] },
        { text: '1', alignment: 'center', margin: [0, 2, 0, 2] },
      ])
    }

    return []
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
