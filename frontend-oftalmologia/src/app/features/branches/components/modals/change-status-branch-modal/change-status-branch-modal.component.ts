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
import { BranchesService } from '../../../../../core/services/api/branches.service'
import { Branch } from '../../../../../core/interfaces/api/branch.interface'

@Component({
  selector: 'app-change-status-branch-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './change-status-branch-modal.component.html',
  styleUrls: ['./change-status-branch-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ChangeStatusBranchModalComponent implements OnInit, OnDestroy {
  @Input() selectedBranch!: Branch
  private destroy$ = new Subject<void>()
  statusForm!: FormGroup
  formLoading = false

  constructor(
    private formBuilder: FormBuilder,
    private activeModal: NgbActiveModal,
    private branchesService: BranchesService
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
    if (this.selectedBranch) {
      this.statusForm.patchValue({ isActive: this.selectedBranch.isActive })
    }
  }

  public onSubmit(): void {
    if (this.statusForm.invalid) return

    this.formLoading = true
    const { isActive } = this.statusForm.value

    this.branchesService
      .updateBranch(this.selectedBranch.id, { isActive })
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
