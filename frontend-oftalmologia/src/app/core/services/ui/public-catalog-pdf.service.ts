import { Injectable } from '@angular/core'
import pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import {
  Column,
  Content,
  ContentColumns,
  ContentTable,
  StyleDictionary,
  TDocumentDefinitions,
} from 'pdfmake/interfaces'
import {
  PublicCatalogPdfData,
  PublicCatalogPdfProduct,
} from '@core/interfaces/ui/public-catalog-pdf.interface'

interface PublicCatalogPdfProductWithImage extends PublicCatalogPdfProduct {
  imageDataUrl: string | null
}

const C = {
  dark:    '#0f172a',
  primary: '#1e3a8a',
  accent:  '#3b82f6',
  green:   '#15803d',
  red:     '#dc2626',
  amber:   '#ca8a04',
  surface: '#f8fafc',
  blue50:  '#eff6ff',
  amber50: '#fefce8',
  border:  '#e2e8f0',
  txt:     '#1e293b',
  mid:     '#475569',
  mute:    '#94a3b8',
  white:   '#ffffff',
}

@Injectable({
  providedIn: 'root',
})
export class PublicCatalogPdfService {
  constructor() {
    if (
      pdfFonts &&
      (pdfFonts as any).pdfMake &&
      (pdfFonts as any).pdfMake.vfs
    ) {
      ;(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs
    }
  }

  async downloadCatalog(data: PublicCatalogPdfData, filename: string): Promise<void> {
    const [products, logoDataUrl] = await Promise.all([
      this.attachImages(data.products),
      data.logoUrl ? this.getImageAsDataUrl(data.logoUrl) : Promise.resolve(null),
    ])
    const docDefinition = this.buildDocumentDefinition({ ...data, products }, logoDataUrl)
    pdfMake.createPdf(docDefinition).download(filename)
  }

  private buildDocumentDefinition(
    data: PublicCatalogPdfData & { products: PublicCatalogPdfProductWithImage[] },
    logoDataUrl: string | null
  ): TDocumentDefinitions {
    const phone = data.branch.phone || 'No disponible'
    return {
      pageSize: 'A4',
      pageMargins: [28, 28, 28, 46],
      content: [
        this.buildCover(data, logoDataUrl),
        this.buildPageHeader(data),
        ...this.buildProductRows(data.products),
        this.buildDisclaimer(),
      ],
      footer: (p, total) => this.buildFooter(data.branch.name, phone, p, total),
      defaultStyle: { font: 'Roboto' },
      styles: this.getStyles(),
    }
  }

  private buildFooter(
    branchName: string,
    phone: string,
    currentPage: number,
    pageCount: number
  ): Content {
    return {
      margin: [28, 8, 28, 0],
      stack: [
        {
          canvas: [
            { type: 'line', x1: 0, y1: 0, x2: 539, y2: 0, lineWidth: 0.5, lineColor: C.border },
          ],
          margin: [0, 0, 0, 4],
        },
        {
          columns: [
            {
              text: `Sucursal: ${branchName}  •  Contacto: ${phone}`,
              style: 'footerText',
              width: '*',
            },
            {
              text: `${currentPage} / ${pageCount}`,
              style: 'footerText',
              alignment: 'right',
              width: 'auto',
            },
          ],
        },
      ],
    } as any
  }

  private buildPageHeader(
    data: PublicCatalogPdfData & { products: PublicCatalogPdfProductWithImage[] }
  ): Content {
    return {
      stack: [
        {
          table: {
            widths: ['*'],
            body: [[
              {
                stack: [
                  { text: data.title || 'Catálogo de Productos', style: 'sectionTitle' },
                  { text: data.branch.name, style: 'sectionBranch', margin: [0, 2, 0, 0] },
                ],
                fillColor: C.blue50,
                margin: [14, 10, 14, 10],
              },
            ]],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: (i: number) => (i === 0 ? 4 : 0),
            vLineColor: () => C.accent,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
          margin: [0, 0, 0, 16],
        },
      ],
      pageBreak: 'before',
    } as any
  }

  private buildDisclaimer(): Content {
    return {
      table: {
        widths: ['*'],
        body: [[
          {
            text: '* Precios y disponibilidad sujetos a cambios sin previo aviso. Para confirmar stock, precios vigentes y promociones, comunícate directamente con la sucursal antes de realizar tu compra.',
            style: 'disclaimer',
            fillColor: C.amber50,
            margin: [12, 8, 12, 8],
          },
        ]],
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: (i: number) => (i === 0 ? 3 : 0),
        vLineColor: () => C.amber,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
      },
      margin: [0, 24, 0, 0],
    } as any
  }

  private buildCover(
    data: PublicCatalogPdfData & { products: PublicCatalogPdfProductWithImage[] },
    logoDataUrl: string | null
  ): Content {
    const generatedOn = data.generatedAt.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const companyName = data.branch.companyName || ''
    const headerRow: any[] = []

    if (logoDataUrl) {
      headerRow.push({
        image: logoDataUrl,
        fit: [60, 62],
        alignment: 'center',
        margin: [16, 14, 8, 14],
      })
    }

    headerRow.push({
      stack: [
        ...(companyName
          ? [{ text: companyName.toUpperCase(), style: 'coverHeaderCompany' }]
          : []),
        { text: data.title || 'Catálogo de Productos', style: 'coverHeaderTitle' },
      ],
      margin: [logoDataUrl ? 4 : 20, logoDataUrl ? 22 : 32, 16, 16],
    })

    const headerWidths: any[] = logoDataUrl ? [80, '*'] : ['*']

    return {
      stack: [
        // Header oscuro con logo y título
        {
          table: {
            widths: headerWidths,
            heights: [92],
            body: [headerRow],
          },
          layout: {
            fillColor: () => C.dark,
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
          margin: [-28, -28, -28, 0],
        },
        // Barra de acento azul
        {
          canvas: [
            { type: 'rect', x: -28, y: 0, w: 600, h: 5, color: C.accent },
          ],
          margin: [0, 0, 0, 40],
        },
        // Info de sucursal
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'SUCURSAL', style: 'coverLabel' },
                { text: data.branch.name, style: 'coverValue', margin: [0, 4, 0, 0] },
                {
                  text: data.branch.address || 'Dirección no registrada',
                  style: 'coverMuted',
                  margin: [0, 4, 0, 0],
                },
              ],
            },
            {
              width: '*',
              stack: [
                { text: 'CONTACTO', style: 'coverLabel' },
                { text: data.branch.phone || 'No disponible', style: 'coverValue', margin: [0, 4, 0, 0] },
                {
                  text: `Generado el ${generatedOn}`,
                  style: 'coverMuted',
                  margin: [0, 4, 0, 0],
                },
              ],
            },
          ],
          columnGap: 28,
          margin: [0, 0, 0, 36],
        },
        // Línea separadora
        {
          canvas: [
            { type: 'line', x1: 0, y1: 0, x2: 539, y2: 0, lineWidth: 1, lineColor: C.border },
          ],
        },
      ],
    }
  }

  private buildProductRows(
    products: PublicCatalogPdfProductWithImage[]
  ): Content[] {
    if (!products.length) {
      return [
        {
          text: 'No hay productos disponibles para esta sucursal.',
          style: 'sectionBranch',
          margin: [0, 20, 0, 0],
        },
      ]
    }

    const rows: Content[] = []

    for (let index = 0; index < products.length; index += 2) {
      const first = products[index]
      const second = products[index + 1]

      const columns: Column[] = [
        { width: '*', stack: [this.buildProductCard(first)] },
      ]
      if (second) {
        columns.push({ width: '*', stack: [this.buildProductCard(second)] })
      } else {
        columns.push({ width: '*', text: '' })
      }

      rows.push({ columns, columnGap: 14, margin: [0, 0, 0, 14] } as ContentColumns)
    }

    return rows
  }

  private buildProductCard(
    product: PublicCatalogPdfProductWithImage
  ): ContentTable {
    const description = this.trimText(product.description || '', 180)
    const hasDiscount =
      !!product.discount &&
      typeof product.discount.finalPrice === 'number' &&
      product.discount.finalPrice < product.unitPrice

    return {
      table: {
        widths: ['*'],
        body: [[
          {
            stack: [
              this.buildCardImage(product.imageDataUrl),
              { text: product.name, style: 'cardTitle', margin: [0, 6, 0, 2] },
              product.brand
                ? { text: product.brand.toUpperCase(), style: 'cardBrand', margin: [0, 0, 0, 8] }
                : { text: '', margin: [0, 0, 0, 0] },
              this.buildPriceBlock(product, hasDiscount),
              description
                ? { text: description, style: 'cardDescription', margin: [0, 8, 0, 0] }
                : { text: '', margin: [0, 0, 0, 0] },
            ],
            margin: [10, 10, 10, 12],
          },
        ]],
      },
      layout: {
        hLineColor: (i: number) => (i === 0 ? C.accent : C.border),
        vLineColor: () => C.border,
        hLineWidth: (i: number) => (i === 0 ? 3 : 0.5),
        vLineWidth: () => 0.5,
      },
    }
  }

  private buildPriceBlock(
    product: PublicCatalogPdfProductWithImage,
    hasDiscount: boolean
  ): Content {
    if (!hasDiscount || !product.discount) {
      return { text: `$${product.unitPrice.toFixed(2)}`, style: 'cardPrice' }
    }

    const disc = product.discount
    const badgeText =
      disc.type === 'PERCENTAGE'
        ? `${disc.value}% OFF`
        : `$${parseFloat(String(disc.value)).toFixed(2)} OFF`

    return {
      stack: [
        {
          columns: [
            {
              text: `$${product.unitPrice.toFixed(2)}`,
              decoration: 'lineThrough',
              color: C.mute,
              fontSize: 10,
              width: 'auto',
            },
            {
              table: {
                widths: ['auto'],
                body: [[
                  {
                    text: badgeText,
                    fontSize: 7,
                    bold: true,
                    color: C.white,
                    fillColor: C.red,
                    margin: [4, 1, 4, 1],
                  },
                ]],
              },
              layout: 'noBorders',
              width: 'auto',
              margin: [6, 0, 0, 0],
            },
          ],
          columnGap: 0,
          margin: [0, 0, 0, 3],
        },
        {
          text: `$${parseFloat(String(disc.finalPrice)).toFixed(2)}`,
          fontSize: 16,
          bold: true,
          color: C.green,
        },
      ],
    } as any
  }

  private buildCardImage(imageDataUrl: string | null): Content {
    if (imageDataUrl) {
      return {
        image: imageDataUrl,
        fit: [220, 140],
        alignment: 'center',
        margin: [0, 0, 0, 4],
      }
    }

    return {
      table: {
        widths: ['*'],
        body: [[
          {
            text: 'Sin imagen',
            alignment: 'center',
            color: C.mute,
            fontSize: 8,
            margin: [0, 44, 0, 44],
            fillColor: C.surface,
          },
        ]],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 4],
    }
  }

  private async attachImages(
    products: PublicCatalogPdfProduct[]
  ): Promise<PublicCatalogPdfProductWithImage[]> {
    const normalized = products.slice(0, 160)
    return Promise.all(
      normalized.map(async (product) => ({
        ...product,
        imageDataUrl: product.imageUrl
          ? await this.getImageAsDataUrl(product.imageUrl)
          : null,
      }))
    )
  }

  private async getImageAsDataUrl(url: string): Promise<string | null> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        return null
      }

      const blob = await response.blob()
      return await this.blobToDataUrl(blob)
    } catch {
      return null
    }
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
          return
        }

        reject(new Error('No fue posible leer imagen en base64'))
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  }

  private trimText(value: string, maxLength: number): string {
    const normalized = value.trim().replace(/\s+/g, ' ')
    if (normalized.length <= maxLength) {
      return normalized
    }

    return `${normalized.slice(0, maxLength - 1)}…`
  }

  private getStyles(): StyleDictionary {
    return {
      // Cover
      coverHeaderCompany: {
        fontSize: 8,
        bold: true,
        color: C.accent,
        characterSpacing: 2,
      },
      coverHeaderTitle: {
        fontSize: 22,
        bold: true,
        color: C.white,
        margin: [0, 4, 0, 0],
      },
      coverLabel: {
        fontSize: 8,
        bold: true,
        color: C.accent,
        characterSpacing: 1,
      },
      coverValue: {
        fontSize: 15,
        bold: true,
        color: C.txt,
      },
      coverMuted: {
        fontSize: 9,
        color: C.mid,
      },
      // Section header
      sectionTitle: {
        fontSize: 13,
        bold: true,
        color: C.primary,
      },
      sectionBranch: {
        fontSize: 9,
        color: C.mid,
      },
      // Cards
      cardTitle: {
        fontSize: 11,
        bold: true,
        color: C.txt,
      },
      cardBrand: {
        fontSize: 8,
        color: C.mid,
        characterSpacing: 0.5,
      },
      cardPrice: {
        fontSize: 16,
        bold: true,
        color: C.primary,
      },
      cardDescription: {
        fontSize: 8,
        color: C.mid,
        italics: true,
        lineHeight: 1.3,
      },
      // Disclaimer
      disclaimer: {
        fontSize: 8,
        color: '#854d0e',
        italics: true,
        lineHeight: 1.4,
      },
      // Footer
      footerText: {
        fontSize: 8,
        color: C.mute,
      },
    }
  }
}
