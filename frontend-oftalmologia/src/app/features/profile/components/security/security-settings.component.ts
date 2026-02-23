import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChangePasswordComponent } from './change-password/change-password.component';

@Component({
  selector: 'security-settings',
  imports: [ChangePasswordComponent],
  templateUrl: './security-settings.component.html',
  styleUrl: './security-settings.component.scss',
})
export class SecuritySettingsComponent {
  private translateService = inject(TranslateService);

  get securityTitle(): string {
    return this.translateService.instant('PROFILE.SECURITY.TITLE');
  }
}
