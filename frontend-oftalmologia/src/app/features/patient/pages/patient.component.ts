import { Component } from '@angular/core'
import { PatientsTableComponent } from '../components/tables/patients-table.component'

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [PatientsTableComponent],
  template: '<app-patients-table></app-patients-table>',
})
export class PatientComponent {}
