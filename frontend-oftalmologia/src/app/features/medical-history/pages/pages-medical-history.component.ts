import { Component } from '@angular/core'
import { TableMedicalHistoryComponent } from '../components/tables/table-medical-history.component'

@Component({
  selector: 'pages-medical-history',
  standalone: true,
  imports: [TableMedicalHistoryComponent],
  templateUrl: './pages-medical-history.component.html',
  styleUrl: './pages-medical-history.component.scss',
})
export class PagesMedicalHistoryComponent {}
