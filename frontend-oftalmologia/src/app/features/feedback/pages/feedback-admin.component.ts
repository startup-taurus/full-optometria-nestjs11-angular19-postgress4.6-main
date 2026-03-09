import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { PageTitleComponent } from '../../../shared/components/layouts/page-title/page-title.component'
import { FeedbackAdminTableComponent } from '@/app/features/feedback/components/tables/feedback-admin-table/feedback-admin-table.component'
import { PermissionsService } from '@core/services/api/permissions.service'

@Component({
  selector: 'app-feedback-admin',
  standalone: true,
  imports: [CommonModule, TranslateModule, PageTitleComponent, FeedbackAdminTableComponent],
  templateUrl: './feedback-admin.component.html',
})
export class FeedbackAdminComponent implements OnInit {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!this.permissionsService.isSuperAdmin()) {
      this.router.navigate(['/feedback'])
    }
  }
}
