import { Component } from '@angular/core'
import { TableInventoryComponent } from '../components/tables/table-inventory.component'
import { PageTitleComponent } from '../../../shared/components/layouts/page-title/page-title.component'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'pages-inventory',
  standalone: true,
  imports: [
    TableInventoryComponent,
    PageTitleComponent,
    TranslateModule,
  ],
  templateUrl: './pages-inventory.component.html',
  styleUrl: './pages-inventory.component.scss',
})
export class PagesInventoryComponent {
  constructor() {}
}
