import { CommonModule } from '@angular/common'
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
} from '@angular/core'
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms'
import { RoleService } from '@core/services/api/role.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { TranslatePipe } from '@ngx-translate/core'
import { Subscription } from 'rxjs'

@Component({
  selector: 'role-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './role-form.component.html',
})
export class RoleFormComponent implements OnInit {
  roleForm!: UntypedFormGroup
  isEditMode: boolean = false;
  roleId: string | null = null;
  private modalData!: Subscription
  public isLoading: boolean = true;
  public isLoadingButton: boolean = false;

  private formBuilder = inject(UntypedFormBuilder)
  private _bsModalService = inject(BootstrapModalService)
  private _roleService = inject(RoleService)
  private _notificationService = inject(ToastrNotificationService)

  ngOnInit(): void {
    this.getConfigForm()
    this.getRolData()
  }

  getConfigForm() {
    this.roleForm = this.formBuilder.group({
      roleName: ['', [Validators.required]],
      description: ['', [Validators.required]],
    })
  }

  getRolData(){
    this.modalData = this._bsModalService.getDataIssued().subscribe((data) => {
      if(data?.roleId){
        this.roleId = data.roleId
        this.isEditMode = true;
        this.loadRoleData();
      }
    });
  }

  private loadRoleData(): void {
    if (!this.roleId) return;
    this.isLoading = true
    this._roleService.getRoleById(this.roleId).subscribe((res) => {
      const roleData = res.data;
      if (roleData) {
        this.roleForm.patchValue({
          roleName: roleData.roleName,
          description: roleData.description,
        });
      }
      this.isLoading = false
    });
  }

  onSubmit() {
    if (this.roleForm.valid) {
      if (this.isEditMode && this.roleId) {
        this.updateRole();
      } else {
        this.createRole();
      }
    }
  }

  private createRole(): void {
    this.isLoadingButton = true
    this._roleService.createRole(this.roleForm.value).subscribe((res) => {
      this._notificationService.showNotification({
        type: 'success',
        title: 'ROLES.TITLE',
        message: res.message,
      });
      this.isLoadingButton = false
      this.afterSubmitForm();
    });
  }

  private updateRole(): void {
    this.isLoadingButton = true
    this._roleService.updateRole(this.roleId!, this.roleForm.value).subscribe((res) => {
      this._notificationService.showNotification({
        type: 'success',
        title: 'ROLES.TITLE',
        message: res.message,
      });
      this.isLoadingButton = false
      this.afterSubmitForm();
    });
  }

  private afterSubmitForm(): void {
    this.closeModal()
  }

  public closeModal(): void {
    this._bsModalService.closeModal()
  }

  ngOnDestroy(): void {
    this.modalData.unsubscribe()
  }
}
