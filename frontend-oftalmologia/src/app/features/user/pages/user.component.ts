import { CommonModule } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'

import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { UsersTableComponent } from '../components/tables/users-table.component'

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, TranslateModule, NgbModule, UsersTableComponent],
  templateUrl: './user.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styles: ``,
})
export class UserComponent {}
