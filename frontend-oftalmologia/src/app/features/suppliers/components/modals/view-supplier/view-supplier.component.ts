import { CommonModule } from '@angular/common'
import { Component, inject, OnInit, OnDestroy } from '@angular/core'
import { Supplier } from '@core/interfaces/api/supplier.interface'
import { ModalWithAction } from '@core/interfaces/ui/bootstrap-modal.interface'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'view-supplier',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './view-supplier.component.html',
  styleUrl: './view-supplier.component.scss',
})
export class ViewSupplierComponent implements OnInit, OnDestroy {
  public supplier?: Supplier

  private unsubscribe$ = new Subject<void>()

  private _activeModal = inject(NgbActiveModal)
  private _bsModalService = inject(
    BootstrapModalService<ModalWithAction<Supplier>>
  )

  ngOnInit(): void {
    this.loadModalData()
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  private loadModalData(): void {
    this._bsModalService
      .getDataIssued()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: ModalWithAction<Supplier>) => {
        if (data && data.selectedRow) {
          this.supplier = data.selectedRow
        }
      })
  }

  public onClose(): void {
    this._activeModal.dismiss()
  }

  public openSupplierWhatsApp(): void {
    const phone = this.formatPhoneForWhatsApp(this.supplier?.phone)
    if (!phone || !this.supplier) {
      return
    }

    const message = encodeURIComponent(
      `Hola, me gustaría obtener información sobre ${this.supplier.name}.`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  public openSupplierEmail(): void {
    if (!this.supplier?.email) {
      return
    }

    const subject = encodeURIComponent(`Consulta - proveedor ${this.supplier.name}`)
    window.location.href = `mailto:${this.supplier.email}?subject=${subject}`
  }

  public openSupplierWebsite(): void {
    if (!this.supplier?.website) {
      return
    }

    const normalizedWebsite = /^(https?:\/\/)/i.test(this.supplier.website)
      ? this.supplier.website
      : `https://${this.supplier.website}`

    window.open(normalizedWebsite, '_blank')
  }

  public canOpenWhatsApp(): boolean {
    return !!this.formatPhoneForWhatsApp(this.supplier?.phone)
  }

  private formatPhoneForWhatsApp(phone?: string): string {
    if (!phone) {
      return ''
    }

    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length >= 8 ? cleanPhone : ''
  }
}
