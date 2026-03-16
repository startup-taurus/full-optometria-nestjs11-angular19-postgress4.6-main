import { Component, Input } from '@angular/core'
import {
  Content,
  ContentColumns,
  StyleDictionary,
  TDocumentDefinitions,
} from 'pdfmake/interfaces'
import {
  PublicCatalogPdfData,
  PublicCatalogPdfProduct,
} from '@core/interfaces/ui/public-catalog-pdf.interface'

export interface CatalogPdfRenderProduct extends PublicCatalogPdfProduct {
  imageDataUrls: string[]
}

export interface CatalogPdfLayoutInput {
  data: PublicCatalogPdfData
  products: CatalogPdfRenderProduct[]
  logoDataUrl: string | null
}

const COLOR = {
  navy: '#0f172a',
  blue: '#1d4ed8',
  text: '#1e293b',
  muted: '#64748b',
  line: '#e2e8f0',
  paper: '#f8fafc',
  white: '#ffffff',
  success: '#15803d',
  danger: '#dc2626',
  accent: '#f59e0b',
}

@Component({
  selector: 'app-catalog-pdf-layout',
  standalone: true,
  templateUrl: './catalog-pdf-layout.component.html',
  styleUrls: ['./catalog-pdf-layout.component.scss'],
})
export class CatalogPdfLayoutComponent {
  @Input() data?: PublicCatalogPdfData

  public static buildDefinition(input: CatalogPdfLayoutInput): TDocumentDefinitions {
    const { data, products, logoDataUrl } = input
    const phone = data.branch.phone || 'No disponible'

    return {
      pageSize: 'A4',
      pageMargins: [34, 34, 34, 46],
      background: (page) =>
        page === 1
          ? undefined
          : {
              canvas: [
                {
                  type: 'rect',
                  x: 0,
                  y: 0,
                  w: 595,
                  h: 842,
                  color: COLOR.paper,
                },
              ],
            },
      content: [
        this.buildCover(data, logoDataUrl),
        ...this.buildProductPages(data, products, logoDataUrl),
        this.buildDisclaimer(),
      ],
      footer: (currentPage, pageCount) =>
        this.buildFooter(data.branch.name, phone, currentPage, pageCount),
      defaultStyle: {
        font: 'Roboto',
      },
      styles: this.getStyles(),
    }
  }

  private static buildCover(
    data: PublicCatalogPdfData,
    logoDataUrl: string | null
  ): Content {
    const generatedOn = data.generatedAt.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return {
      stack: [
        {
          table: {
            widths: ['*'],
            body: [[
              {
                stack: [
                  {
                    columns: [
                      logoDataUrl
                        ? {
                            width: 70,
                            image: logoDataUrl,
                            fit: [58, 58],
                            alignment: 'center',
                          }
                        : { width: 0, text: '' },
                      {
                        width: '*',
                        stack: [
                          {
                            text: (data.branch.companyName || 'Catálogo comercial').toUpperCase(),
                            style: 'coverCompany',
                          },
                          {
                            text: data.title || 'Catálogo de Productos',
                            style: 'coverTitle',
                            margin: [0, 4, 0, 0],
                          },
                        ],
                      },
                    ],
                    columnGap: 14,
                  },
                  {
                    text: 'Guía visual de productos y precios para atención al cliente.',
                    style: 'coverSubtitle',
                    margin: [0, 18, 0, 0],
                  },
                  {
                    columns: [
                      {
                        width: '*',
                        stack: [
                          { text: 'Sucursal', style: 'coverLabel' },
                          { text: data.branch.name, style: 'coverValue' },
                          {
                            text: data.branch.address || 'Dirección no registrada',
                            style: 'coverMuted',
                            margin: [0, 2, 0, 0],
                          },
                        ],
                      },
                      {
                        width: '*',
                        stack: [
                          { text: 'Contacto', style: 'coverLabel' },
                          { text: data.branch.phone || 'No disponible', style: 'coverValue' },
                          {
                            text: `Edición ${generatedOn}`,
                            style: 'coverMuted',
                            margin: [0, 2, 0, 0],
                          },
                        ],
                      },
                    ],
                    columnGap: 22,
                    margin: [0, 24, 0, 0],
                  },
                ],
                fillColor: COLOR.navy,
                margin: [26, 24, 26, 24],
              },
            ]],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
          },
          margin: [0, 0, 0, 0],
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 527,
              y2: 0,
              lineWidth: 3,
              lineColor: COLOR.accent,
            },
          ],
          margin: [0, 14, 0, 22],
        },
 
      ],
    }
  }

  private static buildProductPages(
    data: PublicCatalogPdfData,
    products: CatalogPdfRenderProduct[],
    logoDataUrl: string | null
  ): Content[] {
    if (!products.length) {
      return [
        {
          text: 'No hay productos disponibles para exportar.',
          style: 'emptyState',
          pageBreak: 'before',
        },
      ]
    }

    const pages: Content[] = []

    for (let index = 0; index < products.length; index += 2) {
      const current = products.slice(index, index + 2)
      const pageNumber = Math.floor(index / 2) + 1

      const stack: Content[] = [
        this.buildPageHeader(data, logoDataUrl, pageNumber),
        ...current.flatMap((product, productIndex) => {
          const blocks: Content[] = [this.buildProductBlock(product)]
          if (productIndex < current.length - 1) {
            blocks.push({
              canvas: [
                {
                  type: 'line',
                  x1: 0,
                  y1: 0,
                  x2: 527,
                  y2: 0,
                  lineWidth: 0.8,
                  lineColor: COLOR.line,
                },
              ],
              margin: [0, 12, 0, 16],
            })
          }
          return blocks
        }),
      ]

      pages.push({ stack, pageBreak: 'before' })
    }

    return pages
  }

  private static buildPageHeader(
    data: PublicCatalogPdfData,
    logoDataUrl: string | null,
    page: number
  ): Content {
    return {
      table: {
        widths: ['*'],
        body: [[
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: `Página ${page}`, style: 'pageNumber' },
                  { text: data.branch.name, style: 'pageBranch', margin: [0, 3, 0, 0] },
                ],
              },
              logoDataUrl
                ? {
                    width: 'auto',
                    image: logoDataUrl,
                    fit: [58, 28],
                    alignment: 'right',
                  }
                : { width: 'auto', text: '' },
            ],
            margin: [10, 8, 10, 8],
            fillColor: COLOR.white,
          },
        ]],
      },
      layout: {
        hLineWidth: () => 0.8,
        vLineWidth: () => 0,
        hLineColor: () => COLOR.line,
      },
      margin: [0, 0, 0, 20],
    }
  }

  private static buildProductBlock(product: CatalogPdfRenderProduct): Content {
    return {
      columns: [
        {
          width: 292,
          stack: [this.buildUniformGallery(product.imageDataUrls)],
        },
        {
          width: '*',
          stack: [
            { text: product.name, style: 'productTitle' },
            product.brand
              ? { text: product.brand.toUpperCase(), style: 'productBrand', margin: [0, 6, 0, 0] }
              : { text: '', margin: [0, 0, 0, 0] },
            this.buildPrice(product),
            {
              text:
                this.normalizeText(product.description) ||
                'Descripción no disponible.',
              style: 'productDescription',
              margin: [0, 14, 0, 0],
            },
            {
              text: 'Contáctanos para confirmar disponibilidad y promociones vigentes.',
              style: 'productHelp',
              margin: [0, 14, 0, 0],
            },
          ],
        },
      ],
      columnGap: 22,
      margin: [0, 0, 0, 4],
      unbreakable: true,
    } as ContentColumns
  }

  private static buildUniformGallery(imageDataUrls: string[]): Content {
    if (!imageDataUrls.length) {
      return this.buildImagePlaceholder()
    }

    const rows: Content[] = []
    for (let index = 0; index < imageDataUrls.length; index += 2) {
      const chunk = imageDataUrls.slice(index, index + 2)
      const cols: any[] = chunk.map((image) => ({
        width: '*',
        table: {
          widths: ['*'],
          body: [[
            {
              image,
              fit: [132, 100],
              alignment: 'center',
              margin: [6, 6, 6, 6],
              fillColor: COLOR.white,
            },
          ]],
        },
        layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          hLineColor: () => COLOR.line,
          vLineColor: () => COLOR.line,
        },
      }))

      while (cols.length < 2) {
        cols.push({ width: '*', text: '' })
      }

      rows.push({
        columns: cols,
        columnGap: 8,
        margin: [0, index === 0 ? 0 : 8, 0, 0],
      } as ContentColumns)
    }

    return { stack: rows }
  }

  private static buildImagePlaceholder(): Content {
    return {
      table: {
        widths: ['*'],
        body: [[
          {
            text: 'Sin imágenes disponibles',
            alignment: 'center',
            color: COLOR.muted,
            margin: [0, 110, 0, 110],
            fillColor: COLOR.white,
          },
        ]],
      },
      layout: {
        hLineWidth: () => 0.8,
        vLineWidth: () => 0.8,
        hLineColor: () => COLOR.line,
        vLineColor: () => COLOR.line,
      },
    }
  }

  private static buildPrice(product: CatalogPdfRenderProduct): Content {
    const hasDiscount =
      !!product.discount &&
      typeof product.discount.finalPrice === 'number' &&
      product.discount.finalPrice < product.unitPrice

    if (!hasDiscount || !product.discount) {
      return {
        text: `$${product.unitPrice.toFixed(2)}`,
        style: 'priceMain',
        margin: [0, 14, 0, 0],
      }
    }

    const badgeText =
      product.discount.type === 'PERCENTAGE'
        ? `${product.discount.value}% OFF`
        : `$${product.discount.value} OFF`

    return {
      stack: [
        {
          columns: [
            { text: `$${product.unitPrice.toFixed(2)}`, style: 'priceOld', width: 'auto' },
            { text: badgeText, style: 'discountBadge', width: 'auto', margin: [8, 0, 0, 0] },
          ],
          margin: [0, 14, 0, 0],
        },
        {
          text: `$${product.discount.finalPrice.toFixed(2)}`,
          style: 'priceDiscount',
          margin: [0, 2, 0, 0],
        },
      ],
    }
  }

  private static buildDisclaimer(): Content {
    return {
      table: {
        widths: ['*'],
        body: [[
          {
            stack: [
              { text: 'Importante', style: 'disclaimerTitle' },
              {
                text: 'Precios y disponibilidad sujetos a cambios sin previo aviso. Confirma el valor final y stock con la sucursal antes de comprar.',
                style: 'disclaimerText',
                margin: [0, 6, 0, 0],
              },
            ],
            fillColor: '#fffbeb',
            margin: [14, 12, 14, 12],
          },
        ]],
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: (index: number) => (index === 0 ? 4 : 0),
        vLineColor: () => COLOR.accent,
      },
      margin: [0, 20, 0, 0],
      pageBreak: 'before',
    }
  }

  private static buildFooter(
    branchName: string,
    phone: string,
    currentPage: number,
    pageCount: number
  ): Content {
    return {
      margin: [34, 10, 34, 0],
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
    }
  }

  private static normalizeText(value?: string): string {
    if (!value) return ''
    return value.trim().replace(/\s+/g, ' ')
  }

  private static getStyles(): StyleDictionary {
    return {
      coverCompany: {
        fontSize: 9,
        bold: true,
        color: '#93c5fd',
        characterSpacing: 1.2,
      },
      coverTitle: {
        fontSize: 30,
        bold: true,
        color: COLOR.white,
      },
      coverSubtitle: {
        fontSize: 12,
        color: '#dbeafe',
      },
      coverLabel: {
        fontSize: 8,
        bold: true,
        color: '#93c5fd',
      },
      coverValue: {
        fontSize: 14,
        bold: true,
        color: COLOR.white,
      },
      coverMuted: {
        fontSize: 10,
        color: '#cbd5e1',
      },
      coverBottom: {
        fontSize: 12,
        color: COLOR.text,
      },
      pageNumber: {
        fontSize: 9,
        bold: true,
        color: COLOR.blue,
      },
      pageBranch: {
        fontSize: 16,
        bold: true,
        color: COLOR.text,
      },
      pageBrandMark: {
        fontSize: 10,
        color: COLOR.muted,
      },
      productTitle: {
        fontSize: 19,
        bold: true,
        color: COLOR.text,
      },
      productBrand: {
        fontSize: 9,
        color: COLOR.muted,
      },
      priceMain: {
        fontSize: 24,
        bold: true,
        color: COLOR.blue,
      },
      priceOld: {
        fontSize: 11,
        color: '#94a3b8',
        decoration: 'lineThrough',
      },
      discountBadge: {
        fontSize: 8,
        bold: true,
        color: COLOR.white,
        background: COLOR.danger,
      },
      priceDiscount: {
        fontSize: 26,
        bold: true,
        color: COLOR.success,
      },
      productDescription: {
        fontSize: 10,
        color: COLOR.text,
        lineHeight: 1.4,
      },
      productHelp: {
        fontSize: 9,
        color: COLOR.muted,
      },
      disclaimerTitle: {
        fontSize: 10,
        bold: true,
        color: '#92400e',
      },
      disclaimerText: {
        fontSize: 9,
        color: '#92400e',
        lineHeight: 1.4,
      },
      emptyState: {
        fontSize: 12,
        color: COLOR.muted,
      },
      footerText: {
        fontSize: 8,
        color: COLOR.muted,
      },
    }
  }
}
