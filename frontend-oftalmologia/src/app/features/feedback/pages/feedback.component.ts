import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { PageTitleComponent } from '../../../shared/components/layouts/page-title/page-title.component'
import { CreateFeedbackFormComponent } from '@/app/features/feedback/components/forms/create-feedback-form/create-feedback-form.component'
import { FeedbackTableComponent } from '@/app/features/feedback/components/tables/feedback-table/feedback-table.component'
import { PermissionsService } from '@core/services/api/permissions.service'

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterLink,
    PageTitleComponent,
    CreateFeedbackFormComponent,
    FeedbackTableComponent,
  ],
  templateUrl: './feedback.component.html',
})
export class FeedbackComponent {
  refreshToken = 0

  constructor(public readonly permissionsService: PermissionsService) {}

  onFeedbackCreated(): void {
    this.refreshToken++
  }
}
