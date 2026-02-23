import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TableLaboratoryOrdersComponent } from '../components/tables/table-laboratory-orders.component'

@Component({
  selector: 'pages-laboratory-orders',
  standalone: true,
  imports: [CommonModule, TableLaboratoryOrdersComponent],
  templateUrl: './pages-laboratory-orders.component.html',
  styleUrl: './pages-laboratory-orders.component.scss',
})
export class PagesLaboratoryOrdersComponent {}
