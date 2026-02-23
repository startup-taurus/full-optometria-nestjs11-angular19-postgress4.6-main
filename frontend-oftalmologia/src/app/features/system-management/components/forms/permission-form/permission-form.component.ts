import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ModuleService } from '@core/services/api/module.service';
import { PermissionService } from '@core/services/api/permission.service';
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service';
import { ToastrNotificationService } from '@core/services/ui/notification.service';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'permission-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, TranslatePipe],
  templateUrl: './permission-form.component.html',
})
export class PermissionFormComponent implements OnInit{
  permissionForm!: UntypedFormGroup
  public isEditMode: boolean = false;
  private permissionId: string | null = null;
    private moduleId: string | null = null;
    public moduleName: string = ''
    private modalData!: Subscription
    public isLoading: boolean = true;
    public isLoadingButton: boolean = false;

    private formBuilder = inject(UntypedFormBuilder)
      private _bsModalService = inject(BootstrapModalService)
      private _permissionService = inject(PermissionService)
      private _moduleService = inject(ModuleService)
      private _notificationService = inject(ToastrNotificationService)

    ngOnInit(): void {
     this.getConfigForm()
     this.getPermissionData()
    }

    getConfigForm() {
        this.permissionForm = this.formBuilder.group({
          permissionName: ['', [Validators.required]],
          description: ['', [Validators.required]],
        })
      }

      getPermissionData() {
        this.modalData = this._bsModalService.getDataIssued().subscribe((data) => {
          if (data?.permissionId || data?.moduleId) {
            this.permissionId = data.permissionId ?? null;
            this.moduleId = data.moduleId ?? null;
            this.isEditMode = !!this.permissionId;

            if (this.permissionId) {
              this.loadPermissionData();
            }

            if (this.moduleId) {
              this.loadModuleData();
            }
          }
        });
      }

    private loadModuleData(): void {
      if (!this.moduleId) return;
      this.isLoading = true
      this._moduleService.getModuleById(this.moduleId).subscribe((res) => {
        const moduleData = res.data;
        if (moduleData) {
          this.moduleName = moduleData.moduleName
        }
        this.isLoading = false
      });
    }

    private loadPermissionData(): void {
      if (!this.permissionId) return;
      this.isLoading = true
      this._permissionService.getPermissionById(this.permissionId).subscribe((res) => {
        const permissionData = res.data;
        if (permissionData) {
          this.permissionForm.patchValue({
            permissionName: permissionData.permissionName,
            description: permissionData.description,
          });
        }
        this.isLoading = false
      });
    }

    onSubmit() {
      if (this.permissionForm.valid) {
        if (this.isEditMode && this.permissionId) {
          this.updatePermission();
        } else {
          this.createPermission();
        }
      }
    }

    private createPermission(): void {
      this.isLoadingButton = true
      const permissionData = {
        ...this.permissionForm.value,
        moduleId: this.moduleId,
      };
      this._permissionService.createPermission(permissionData).subscribe((res) => {
        this._notificationService.showNotification({
          type: 'success',
          title: 'ROLES.TITLE',
          message: res.message,
        });
        this.isLoadingButton = false
        this.afterSubmitForm();
      });
    }

    private updatePermission(): void {
      this.isLoadingButton = true
      this._permissionService.updatePermission(this.permissionId!, this.permissionForm.value).subscribe((res) => {
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
