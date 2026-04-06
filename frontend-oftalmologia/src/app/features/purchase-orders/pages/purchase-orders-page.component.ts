import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TablePurchaseOrdersComponent } from '../components/tables/table-purchase-orders.component'

@Component({
  selector: 'app-purchase-orders-page',
  standalone: true,
  imports: [CommonModule, TablePurchaseOrdersComponent],
  templateUrl: './purchase-orders-page.component.html',
  styleUrl: './purchase-orders-page.component.scss',
})
export class PurchaseOrdersPageComponent {}
