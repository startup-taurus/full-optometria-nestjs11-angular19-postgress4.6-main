import { Component } from '@angular/core'
import { TableBranchesComponent } from '../components/tables/table-branches.component'

@Component({
  selector: 'pages-branches',
  standalone: true,
  imports: [TableBranchesComponent],
  templateUrl: './pages-branches.component.html',
  styleUrl: './pages-branches.component.scss',
})
export class PagesBranchesComponent {}
