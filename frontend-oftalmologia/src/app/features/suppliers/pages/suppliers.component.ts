import { Component } from '@angular/core'
import { SuppliersTableComponent } from '../components/tables/suppliers-table.component'
import { PageTitleComponent } from '../../../shared/components/layouts/page-title/page-title.component'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [SuppliersTableComponent, PageTitleComponent, TranslateModule],
  templateUrl: './suppliers.component.html',
})
export class SuppliersComponent {
  constructor() {
  }
}
