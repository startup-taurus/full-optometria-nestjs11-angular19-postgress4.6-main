import { Injectable } from '@angular/core'
import pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import {
  PublicCatalogPdfData,
  PublicCatalogPdfProduct,
} from '@core/interfaces/ui/public-catalog-pdf.interface'
import {
  CatalogPdfLayoutComponent,
  CatalogPdfRenderProduct,
} from '../../../shared/components/catalog-pdf-layout/catalog-pdf-layout.component'

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

    const definition = CatalogPdfLayoutComponent.buildDefinition({
      data,
      products,
      logoDataUrl,
    })

    pdfMake.createPdf(definition).download(filename)
  }

  private async attachImages(
    products: PublicCatalogPdfProduct[]
  ): Promise<CatalogPdfRenderProduct[]> {
    return Promise.all(
      products.map(async (product) => {
        const urls = [
          ...(product.imageUrls || []),
          ...(product.imageUrl && !product.imageUrls?.includes(product.imageUrl)
            ? [product.imageUrl]
            : []),
        ]

        const imageDataUrls = (
          await Promise.all(urls.map((url) => this.getImageAsDataUrl(url)))
        ).filter((image): image is string => !!image)

        return {
          ...product,
          imageDataUrls,
        }
      })
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
}
