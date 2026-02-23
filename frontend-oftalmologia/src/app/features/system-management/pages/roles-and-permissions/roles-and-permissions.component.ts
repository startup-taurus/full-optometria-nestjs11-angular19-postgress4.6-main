import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleComponent } from '@/app/shared/components/layouts/page-title/page-title.component';
import { RoleLeftSideBarComponent } from '../../components/hierarchical-list/role-left-side-bar/role-left-side-bar.component';
import { ModuleAreaComponent } from '../../components/hierarchical-list/module-area/module-area.component';
import { PermissionRigthSideBarComponent } from '../../components/hierarchical-list/permission-rigth-side-bar/permission-rigth-side-bar.component';
import { TranslatePipe } from '@ngx-translate/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { SelectionService } from '@core/services/ui/selection.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'roles-and-permissions',
  standalone: true,
  imports: [
    CommonModule,
    PageTitleComponent,
    RoleLeftSideBarComponent,
    ModuleAreaComponent,
    PermissionRigthSideBarComponent,
    TranslatePipe,
    NgbNavModule
  ],
  templateUrl: './roles-and-permissions.component.html',
  styleUrl: './roles-and-permissions.component.scss',
})
export class RolesAndPermissionsComponent implements OnInit {
  public activeTab: 'list' | 'new' = 'list';
  public selectedRoleId: string | null = null;
  public selectedModuleId: string | null = null;
  public currentMobileView: 'roles' | 'modules' | 'permissions' = 'roles';

  private _selectionService = inject(SelectionService);
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.subscriptions.push(
      this._selectionService.selectedRoleId$.subscribe(
        (roleId) => {
          this.selectedRoleId = roleId;
          if (roleId && window.innerWidth < 992) {
            this.currentMobileView = 'modules';
          }
        }
      )
    );

    this.subscriptions.push(
      this._selectionService.selectedModuleId$.subscribe(
        (moduleId) => {
          this.selectedModuleId = moduleId;
          if (moduleId && window.innerWidth < 992) {
            this.currentMobileView = 'permissions';
          }
        }
      )
    );

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  public navigateBack(): void {
    if (this.currentMobileView === 'permissions') {
      this.currentMobileView = 'modules';
      this._selectionService.setModuleId(null);
    } else if (this.currentMobileView === 'modules') {
      this.currentMobileView = 'roles';
      this._selectionService.setRoleId(null);
      this._selectionService.setModuleId(null);
    }
  }

  public getMobileTitle(): string {
    switch (this.currentMobileView) {
      case 'roles':
        return 'ROLES_AND_PERMISSIONS.ROLE.LIST_ROLES';
      case 'modules':
        return 'ROLES_AND_PERMISSIONS.MODULE.LIST_MODULES';
      case 'permissions':
        return 'ROLES_AND_PERMISSIONS.PERMISSION.LIST_PERMISSIONS';
      default:
        return 'ROLES_AND_PERMISSIONS.ROLE.TITLE';
    }
  }

  public closeOffcanvas(): void {
    const offcanvasElement = document.getElementById('rolesOffcanvas');
    if (offcanvasElement) {
      const offcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvasElement);
      if (offcanvas) {
        offcanvas.hide();
      }
    }
  }

  private onWindowResize(): void {
    if (window.innerWidth >= 992) {
      this.currentMobileView = 'roles';
    }
  }
}
