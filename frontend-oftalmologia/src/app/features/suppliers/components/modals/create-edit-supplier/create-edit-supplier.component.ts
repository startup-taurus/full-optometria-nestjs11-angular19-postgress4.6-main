import { CommonModule } from '@angular/common'
import { Component, inject, OnInit, OnDestroy } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { BUTTON_ACTIONS } from '@core/helpers/ui/constants'
import { Supplier } from '@core/interfaces/api/supplier.interface'
import { ModalWithAction } from '@core/interfaces/ui/bootstrap-modal.interface'
import { ButtonAction } from '@core/interfaces/ui/ui.interface'
import { SupplierService } from '@core/services/api/supplier.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'
import Swal from 'sweetalert2'

@Component({
  selector: 'create-edit-supplier',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './create-edit-supplier.component.html',
  styleUrl: './create-edit-supplier.component.scss',
})
export class CreateEditSupplierComponent implements OnInit, OnDestroy {
  public BUTTON_ACTIONS = BUTTON_ACTIONS
  public form!: FormGroup
  public isEdit = false
  public isLoading = false
  public supplier?: Supplier
  public buttonAction?: ButtonAction

  private unsubscribe$ = new Subject<void>()

  private _activeModal = inject(NgbActiveModal)
  private _fb = inject(FormBuilder)
  private _supplierService = inject(SupplierService)
  private _bsModalService = inject(
    BootstrapModalService<ModalWithAction<Supplier>>
  )

  ngOnInit(): void {
    this.loadModalData()
    this.initializeForm()
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
        if (data) {
          this.buttonAction = data.buttonAction
          this.supplier = data.selectedRow
          this.isEdit = this.buttonAction === BUTTON_ACTIONS.EDIT

          if (this.form) {
            this.initializeForm()
          }
        }
      })
  }

  private initializeForm(): void {
    this.form = this._fb.group({
      name: [
        { value: this.supplier?.name || '', disabled: false },
        [Validators.required, Validators.maxLength(100)],
      ],
      documentNumber: [
        { value: this.supplier?.documentNumber || '', disabled: false },
        [Validators.maxLength(20)],
      ],
      phone: [
        { value: this.supplier?.phone || '', disabled: false },
        [Validators.required, Validators.maxLength(20)],
      ],
      email: [
        { value: this.supplier?.email || '', disabled: false },
        [Validators.required, Validators.email],
      ],
      isActive: [{ value: this.supplier?.isActive ?? true, disabled: false }],
    })
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched()
      return
    }

    this.isLoading = true
    const formData = { ...this.form.value }

    if (!this.isEdit) {
      delete formData.isActive
    }

    const operation$ = this.isEdit
      ? this._supplierService.updateSupplier(this.supplier!.id, formData)
      : this._supplierService.createSupplier(formData)

    operation$.pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (response) => {
        this.isLoading = false
        const result = this.isEdit ? 'updated' : 'created'
        this._activeModal.close(result)
      },
      error: (error) => {
        this.isLoading = false


        Swal.fire({
          title: 'Error',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#d33',
        })
      },
    })
  }

  public onCancel(): void {
    this._activeModal.dismiss()
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key)
      control?.markAsTouched()
    })
  }

  public isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  public getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName)
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'VALIDATION.REQUIRED'
      }
      if (field.errors['maxlength']) {
        return 'VALIDATION.MAX_LENGTH'
      }
      if (field.errors['email']) {
        return 'VALIDATION.INVALID_EMAIL'
      }
    }
    return ''
  }
}
