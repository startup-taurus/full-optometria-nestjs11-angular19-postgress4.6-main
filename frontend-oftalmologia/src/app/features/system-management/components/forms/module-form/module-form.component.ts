import { CommonModule } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms'
import { ModuleService } from '@core/services/api/module.service'
import { RoleService } from '@core/services/api/role.service'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import { TranslatePipe } from '@ngx-translate/core'
import { Subscription } from 'rxjs'

@Component({
  selector: 'module-form',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, TranslatePipe],
  templateUrl: './module-form.component.html',
  styleUrl: './module-form.component.scss',
})
export class ModuleFormComponent implements OnInit {
  moduleForm!: UntypedFormGroup
  isEditMode: boolean = false
  moduleId: string | null = null
  private modalData!: Subscription
  public isLoading: boolean = true
  public isLoadingButton: boolean = false

  private formBuilder = inject(UntypedFormBuilder)
  private _bsModalService = inject(BootstrapModalService)
  private _moduleService = inject(ModuleService)
  private _notificationService = inject(ToastrNotificationService)

  ngOnInit(): void {
    this.getConfigForm()
    this.getModuleData()
  }

  getConfigForm() {
    this.moduleForm = this.formBuilder.group({
      moduleName: ['', [Validators.required]],
      description: ['', [Validators.required]],
    })
  }

  getModuleData() {
    this.modalData = this._bsModalService.getDataIssued().subscribe((data) => {
      if (data?.moduleId) {
        this.moduleId = data.moduleId
        this.isEditMode = true
        this.loadModuleData()
      }
    })
  }

  private loadModuleData() {
    if (!this.moduleId) return
    this.isLoading = true
    this._moduleService.getModuleById(this.moduleId).subscribe((res) => {
      const moduleData = res.data
      if (moduleData) {
        this.moduleForm.patchValue({
          moduleName: moduleData.moduleName,
          description: moduleData.description,
        })
      }
      this.isLoading = false
    })
  }

  onSubmit() {
    if (this.moduleForm.valid) {
      if (this.isEditMode && this.moduleId) {
        this.editModule()
      } else {
        this.createModule()
      }
    }
  }

  private createModule(): void {
    this.isLoadingButton = true
    this._moduleService.createModule(this.moduleForm.value).subscribe((res) => {
      const message = res.message
      this._notificationService.showNotification({
        type: 'success',
        title: 'ROLES.MODULE_SIDEBAR.TITLE',
        message,
      })
      this.isLoadingButton = false
      this.afterSubmitForm()
    })
  }

  private editModule(): void {
    this.isLoadingButton = true

    this._moduleService
      .updateModule(this.moduleId!, this.moduleForm.value)
      .subscribe((res) => {
        this._notificationService.showNotification({
          type: 'success',
          title: 'ROLES.MODULE_SIDEBAR.TITLE',
          message: res.message,
        })
        this.isLoadingButton = false
        this.afterSubmitForm()
      })
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
