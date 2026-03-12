import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, Output } from '@angular/core'

@Component({
  selector: '[appCatalogPdfExport]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog-pdf-export.component.html',
  styleUrls: ['./catalog-pdf-export.component.scss'],
})
export class CatalogPdfExportComponent {
  @Input() disabled = false
  @Input() loading = false
  @Output() readonly exportCatalog = new EventEmitter<void>()

  onExport(): void {
    if (this.disabled || this.loading) {
      return
    }

    this.exportCatalog.emit()
  }
}
