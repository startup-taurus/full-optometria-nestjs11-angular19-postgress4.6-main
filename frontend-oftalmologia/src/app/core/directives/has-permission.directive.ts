import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { PermissionsService } from '../services/api/permissions.service'
import { PermissionId } from '../constants/permissions.constants'

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()
  private hasView = false

  @Input() set appHasPermission(
    permissions: PermissionId | PermissionId[] | string | string[]
  ) {
    this.permissions = Array.isArray(permissions) ? permissions : [permissions]
    this.updateView()
  }

  @Input() appHasPermissionOperator: 'AND' | 'OR' = 'OR'

  private permissions: string[] = []

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit() {
    this.permissionsService.userPermissions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateView()
      })
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private updateView(): void {
    const hasPermission = this.checkPermissions()

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef)
      this.hasView = true
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear()
      this.hasView = false
    }
  }

  private checkPermissions(): boolean {
    if (this.permissions.length === 0) {
      return true
    }

    if (this.appHasPermissionOperator === 'AND') {
      return this.permissionsService.hasAllPermissionsById(this.permissions)
    } else {
      return this.permissionsService.hasAnyPermissionById(this.permissions)
    }
  }
}
