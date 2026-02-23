import { Component } from '@angular/core'
import { TableCompaniesComponent } from '../components/tables/table-companies.component'

@Component({
  selector: 'pages-companies',
  standalone: true,
  imports: [TableCompaniesComponent],
  templateUrl: './pages-companies.component.html',
  styleUrl: './pages-companies.component.scss',
})
export class PagesCompaniesComponent {}
