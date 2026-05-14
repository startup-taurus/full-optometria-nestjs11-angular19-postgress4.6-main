import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { Subject, takeUntil } from 'rxjs'
import { TranslateModule } from '@ngx-translate/core'
import { TablePurchaseOrdersComponent } from '../components/tables/table-purchase-orders.component'

@Component({
  selector: 'app-purchase-orders-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, TablePurchaseOrdersComponent],
  templateUrl: './purchase-orders-page.component.html',
  styleUrl: './purchase-orders-page.component.scss',
})
export class PurchaseOrdersPageComponent implements OnInit, OnDestroy {
  public laboratoryOrderId: string | null = null

  private readonly destroy$ = new Subject<void>()
  private readonly _route = inject(ActivatedRoute)
  private readonly _router = inject(Router)

  ngOnInit(): void {
    this._route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (queryParamMap) => {
        this.laboratoryOrderId = queryParamMap.get('laboratoryOrderId')
      },
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  public clearLinkedFilter(): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        laboratoryOrderId: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }
}
