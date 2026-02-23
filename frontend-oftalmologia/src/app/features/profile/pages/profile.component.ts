import { PageTitleComponent } from '@/app/shared/components/layouts/page-title/page-title.component'
import { Component } from '@angular/core'
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap'
import { TranslatePipe } from '@ngx-translate/core'
import { ProfileDetailsComponent } from '../components/profile-details/profile-details.component'
import { SecuritySettingsComponent } from '../components/security/security-settings.component'


@Component({
  selector: 'profile',
  standalone: true,
  imports: [
    PageTitleComponent,
    TranslatePipe,
    NgbNavModule,
    TranslatePipe,
    ProfileDetailsComponent,
    SecuritySettingsComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {}
