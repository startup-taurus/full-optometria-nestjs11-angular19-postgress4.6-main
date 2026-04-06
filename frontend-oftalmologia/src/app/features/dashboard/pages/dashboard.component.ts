import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { AppointmentsTrendChartComponent } from '../components/appointments-trend-chart/appointments-trend-chart.component'
import { DiagnosisFrequencyChartComponent } from '../components/diagnosis-frequency-chart/diagnosis-frequency-chart.component'
import { LaboratoryOrdersStatusChartComponent } from '../components/laboratory-orders-status-chart/laboratory-orders-status-chart.component'
import { ProductsInventoryChartComponent } from '../components/products-inventory-chart/products-inventory-chart.component'
import { ShiftStatusDistributionChartComponent } from '../components/shift-status-distribution-chart/shift-status-distribution-chart.component'
import { PatientsAgeDistributionChartComponent } from '../components/patients-age-distribution-chart/patients-age-distribution-chart.component'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AppointmentsTrendChartComponent,
    DiagnosisFrequencyChartComponent,
    LaboratoryOrdersStatusChartComponent,
    ProductsInventoryChartComponent,
    ShiftStatusDistributionChartComponent,
    PatientsAgeDistributionChartComponent,
    TranslateModule,
  ],
  templateUrl: './dashboard.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styles: ``,
})
export class DashboardComponent {}
