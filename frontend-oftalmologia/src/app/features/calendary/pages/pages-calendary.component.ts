import { Component } from '@angular/core'
import { CalendaryComponent } from '../components/calendary.component'

@Component({
  selector: 'app-pages-calendary',
  standalone: true,
  imports: [CalendaryComponent],
  templateUrl: './pages-calendary.component.html',
  styleUrls: ['./pages-calendary.component.scss'],
})
export class PagesCalendaryComponent {}
