import { Component, OnInit, OnDestroy, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Subject, takeUntil } from 'rxjs'
import { BranchesService } from '../../../../../core/services/api/branches.service'
import {
  Branch,
  CreateBranchDto,
  UpdateBranchDto,
} from '../../../../../core/interfaces/api/branch.interface'

@Component({
  selector: 'app-branch-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './branch-modal.component.html',
  styleUrls: ['./branch-modal.component.scss'],
})
export class BranchModalComponent implements OnInit, OnDestroy {
  @Input() editMode = false
  @Input() selectedBranch: Branch | null = null

  private destroy$ = new Subject<void>()

  branchForm!: FormGroup
  formLoading = false

  constructor(
    private formBuilder: FormBuilder,
    private activeModal: NgbActiveModal,
    private branchesService: BranchesService
  ) {
    this.initializeForm()
  }

  ngOnInit(): void {
    if (this.editMode && this.selectedBranch) {
      this.populateForm()
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeForm(): void {
    this.branchForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(20)]],
      address: ['', [Validators.required, Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      phone: ['', [Validators.maxLength(20)]],
      corporateEmail: ['', [Validators.email]],
      openingHours: ['', [Validators.maxLength(100)]],
    })
  }

  private populateForm(): void {
    if (!this.selectedBranch) return

    this.branchForm.patchValue({
      name: this.selectedBranch.name,
      code: this.selectedBranch.code,
      address: this.selectedBranch.address,
      city: this.selectedBranch.city,
      phone: this.selectedBranch.phone || '',
      corporateEmail: this.selectedBranch.corporateEmail || '',
      openingHours: this.selectedBranch.openingHours || '',
    })
  }

  public onSubmit(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched()
      return
    }

    this.formLoading = true

    if (this.editMode && this.selectedBranch) {
      this.updateBranch()
    } else {
      this.createBranch()
    }
  }

  private createBranch(): void {
    const branchData: CreateBranchDto = this.branchForm.value

    this.branchesService
      .createBranch(branchData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.formLoading = false
          this.activeModal.close('created')
        },
        error: (error) => {
          this.formLoading = false
        },
      })
  }

  private updateBranch(): void {
    if (!this.selectedBranch) return

    const branchData: UpdateBranchDto = this.branchForm.value

    this.branchesService
      .updateBranch(this.selectedBranch.id, branchData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.formLoading = false
          this.activeModal.close('updated')
        },
        error: (error) => {
          this.formLoading = false
        },
      })
  }

  public isFieldInvalid(fieldName: string): boolean {
    const field = this.branchForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  public getFieldError(fieldName: string): string {
    const field = this.branchForm.get(fieldName)
    if (!field || !field.errors) return ''

    const errors = field.errors

    if (errors['required']) {
      return 'VALIDATION.REQUIRED'
    }
    if (errors['maxlength']) {
      return 'VALIDATION.MAX_LENGTH'
    }
    if (errors['email']) {
      return 'VALIDATION.INVALID_EMAIL'
    }

    return ''
  }

  public closeModal(): void {
    this.activeModal.dismiss()
  }
}
