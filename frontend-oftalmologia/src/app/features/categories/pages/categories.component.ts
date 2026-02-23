import { Component } from '@angular/core'
import { CategoriesTableComponent } from '../components/tables/categories-table.component'
import { PageTitleComponent } from '../../../shared/components/layouts/page-title/page-title.component'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CategoriesTableComponent, PageTitleComponent, TranslateModule],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent {}
