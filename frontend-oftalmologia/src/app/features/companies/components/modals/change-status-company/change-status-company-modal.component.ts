import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ViewEncapsulation,
} from '@angular/core'
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
import { CompanyService } from '../../../../../core/services/api/company.service'
import { Company } from '../../../../../core/interfaces/api/company.interface'

@Component({
  selector: 'app-change-status-company-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './change-status-company-modal.component.html',
  styleUrls: ['./change-status-company-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ChangeStatusCompanyModalComponent implements OnInit, OnDestroy {
  @Input() selectedCompany!: Company
  private destroy$ = new Subject<void>()
  statusForm!: FormGroup
  formLoading = false

  constructor(
    private formBuilder: FormBuilder,
    private activeModal: NgbActiveModal,
    private companyService: CompanyService
  ) {
    this.statusForm = this.formBuilder.group({
      isActive: [true, Validators.required],
    })
  }

  ngOnInit(): void {
    this.setCurrentStatus()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private setCurrentStatus(): void {
    if (this.selectedCompany) {
      this.statusForm.patchValue({ isActive: this.selectedCompany.isActive })
    }
  }

  public onSubmit(): void {
    if (this.statusForm.invalid) return

    this.formLoading = true
    const { isActive } = this.statusForm.value

    this.companyService
      .updateCompany(this.selectedCompany.id, { isActive })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.formLoading = false
          this.activeModal.close('updated')
        },
        error: (error) => {
          this.formLoading = false
        },
      })
  }

  public closeModal(): void {
    this.activeModal.dismiss()
  }
}
