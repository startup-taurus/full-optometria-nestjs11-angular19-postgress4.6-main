import { Component } from '@angular/core'
import { TableShiftManagementComponent } from '../components/tables/table-shift-management.component'

@Component({
  selector: 'pages-shift-management',
  standalone: true,
  imports: [TableShiftManagementComponent],
  templateUrl: './pages-shift-management.component.html',
  styleUrl: './pages-shift-management.component.scss',
})
export class PagesShiftManagementComponent {}
