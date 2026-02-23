import { CommonModule } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'blocked',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  templateUrl: './blocked.component.html',
  styleUrls: ['./blocked.component.scss'],
})
export class BlockedComponent {
  constructor() {
  }
}
