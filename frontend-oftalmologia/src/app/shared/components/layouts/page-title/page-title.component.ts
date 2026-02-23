import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'page-title',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: ` <div
    class="page-title-head d-flex align-items-sm-center flex-sm-row flex-column gap-2"
  >
    <div class="flex-grow-1">
      <h4 class="fs-18 fw-semibold mb-0">{{ title }}</h4>
    </div>

    <div class="text-end">
      <ol class="breadcrumb m-0 py-0">
        <li class="breadcrumb-item">
          <a href="javascript: void(0);">{{ 'WORDS.HOME' | translate }}</a>
        </li>
        <li class="breadcrumb-item" *ngIf="subtitle">
          <a href="javascript: void(0);">{{ subtitle }}</a>
        </li>
        <li class="breadcrumb-item active">{{ title }}</li>
      </ol>
    </div>
  </div>`,
})
export class PageTitleComponent {
  @Input() title: string = ''
  @Input() subtitle: string = ''
}
